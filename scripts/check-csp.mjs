// npm run check:csp (part of verify, after the build). Starts the built site and,
// for every page, checks that the Content-Security-Policy would allow everything
// on it and that the security headers are present (ADR 009):
// - every <script>, <style> and script preload carries the request's nonce
// - the nonce changes per request, and a client-sent x-nonce is never used
// - no 'unsafe-inline' for scripts, no inline handlers, style attributes or javascript: URLs
// - HTML is never cacheable (a cached page would reuse a nonce)
// - pages under /api and prefetch requests get the policy too
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SECURITY_HEADERS } from "../lib/security/headers.mjs";

/**
 * Checks one page's HTML against its CSP header. Returns a list of problems.
 * @param {string} html
 * @param {string | null} csp
 */
export function checkPage(html, csp) {
  const problems = [];
  if (!csp) return ["no Content-Security-Policy header"];
  const directives = csp.split(";").map((d) => d.trim());
  const scriptSrc = directives.find((d) => d.startsWith("script-src")) ?? "";
  if (/'unsafe-inline'/.test(scriptSrc)) problems.push("script-src allows 'unsafe-inline'");
  const nonce = scriptSrc.match(/'nonce-([^']+)'/)?.[1];
  if (!nonce) return [...problems, "script-src has no nonce"];

  const withoutNonce = (attrs) => attrs.match(/\bnonce="([^"]*)"/)?.[1] !== nonce;
  for (const m of html.matchAll(/<script\b([^>]*)>/gi)) {
    if (withoutNonce(m[1])) {
      const kind = /\bsrc=/.test(m[1]) ? "external" : "inline";
      problems.push(`${kind} <script> without the request's nonce: <script${m[1].slice(0, 80)}>`);
    }
  }
  for (const m of html.matchAll(/<style\b([^>]*)>/gi)) {
    if (withoutNonce(m[1])) problems.push("<style> without the request's nonce");
  }
  for (const m of html.matchAll(/<link\b([^>]*)>/gi)) {
    const attrs = m[1];
    const scriptPreload = /\bas="script"/.test(attrs) || /\brel="modulepreload"/.test(attrs);
    if (scriptPreload && withoutNonce(attrs)) problems.push(`script preload without the request's nonce: <link${attrs.slice(0, 80)}>`);
  }
  // Inline event handlers, style attributes and javascript: URLs are blocked by this policy too.
  const handler = html.match(/<[a-z][^>]*\s(on[a-z]+)=["']/i);
  if (handler) problems.push(`inline event handler attribute ${handler[1]}`);
  if (/<[a-z][^>]*\sstyle=["']/i.test(html)) problems.push("inline style attribute");
  if (/\b(href|src|action)=["']\s*javascript:/i.test(html)) problems.push("javascript: URL");
  return problems;
}

/** Security headers and caching that every HTML page must have. */
export function checkHeaders(headers) {
  const problems = [];
  for (const { key, value } of SECURITY_HEADERS) {
    if (headers.get(key) !== value) problems.push(`missing or wrong header ${key}`);
  }
  if (headers.get("x-powered-by")) problems.push("X-Powered-By is sent");
  if (!/no-store/.test(headers.get("cache-control") ?? "")) problems.push("HTML is cacheable (Cache-Control lacks no-store)");
  return problems;
}

export function nonceOf(csp) {
  return csp?.match(/'nonce-([^']+)'/)?.[1] ?? null;
}

/** Page paths from the build manifest; dynamic routes, route handlers and file routes (icon.svg) are skipped. */
export function pagesFromManifest(manifest) {
  return Object.values(manifest)
    .filter((p) => typeof p === "string" && !p.includes("[") && !p.startsWith("/api/") && !p.startsWith("/_") && !/\.[a-z0-9]+$/i.test(p))
    .sort();
}

async function waitForServer(base, tries = 120) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(base, { signal: AbortSignal.timeout(2_000) });
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Built site did not start.");
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const manifestPath = join(root, ".next", "app-path-routes-manifest.json");
  if (!existsSync(manifestPath)) throw new Error(".next/app-path-routes-manifest.json not found. Run next build first.");
  const pages = pagesFromManifest(JSON.parse(readFileSync(manifestPath, "utf8")));
  // Plus a 404 page, and a 404 under /api, which also renders HTML.
  pages.push("/a-page-that-does-not-exist", "/api/a-route-that-does-not-exist");

  const port = 3200 + Math.floor(Math.random() * 500);
  const base = `http://127.0.0.1:${port}`;
  const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "ignore",
  });

  const failures = [];
  try {
    await waitForServer(base);
    for (const path of pages) {
      const first = await fetch(base + path);
      const second = await fetch(base + path);
      const csp = first.headers.get("content-security-policy");
      for (const p of checkPage(await first.text(), csp)) failures.push(`${path}: ${p}`);
      for (const p of checkHeaders(first.headers)) failures.push(`${path}: ${p}`);
      await second.text();
      const a = nonceOf(csp);
      if (!a || a === nonceOf(second.headers.get("content-security-policy"))) failures.push(`${path}: nonce does not change per request`);
    }

    // A prefetch request carrying a forged x-nonce must still get a fresh policy.
    const forged = await fetch(`${base}/`, { headers: { purpose: "prefetch", "next-router-prefetch": "1", "x-nonce": "forgedforgedforged12==" } });
    const forgedCsp = forged.headers.get("content-security-policy");
    const forgedHtml = await forged.text();
    if (!forgedCsp) failures.push("prefetch request: no Content-Security-Policy");
    if (nonceOf(forgedCsp) === "forgedforgedforged12==" || forgedHtml.includes("forgedforgedforged12==")) {
      failures.push("prefetch request: a client-sent x-nonce was used");
    }
  } finally {
    server.kill();
  }

  if (failures.length > 0) {
    console.error(`CSP check failed:\n${failures.map((f) => `  ${f}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`CSP check passed: ${pages.length} pages and a forged prefetch; every script and style carries a fresh per-request nonce, and the security headers are present.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`CSP check failed: ${err instanceof Error ? err.message : "unknown error"}`);
    process.exit(1);
  });
}
