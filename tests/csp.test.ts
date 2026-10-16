// Content-Security-Policy (ADR 009): the policy itself, the proxy, and the page check.
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { buildCsp, makeNonce } from "@/lib/security/csp.mjs";
import { checkHeaders, checkPage, nonceOf, pagesFromManifest } from "@/scripts/check-csp.mjs";
import { SECURITY_HEADERS } from "@/lib/security/headers.mjs";
import { config, proxy } from "@/proxy";

describe("buildCsp", () => {
  const csp = buildCsp("abcdefghijklmnop1234==");

  it("is strict: nonce and strict-dynamic for scripts, no unsafe-inline or unsafe-eval in production", () => {
    expect(csp).toContain("script-src 'self' 'nonce-abcdefghijklmnop1234==' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    for (const d of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'", "connect-src 'self'"]) {
      expect(csp).toContain(d);
    }
  });

  it("adds unsafe-eval only in development and upgrade-insecure-requests only when asked", () => {
    expect(buildCsp("abcdefghijklmnop1234==", { dev: true })).toContain("'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(buildCsp("abcdefghijklmnop1234==", { upgrade: true })).toContain("upgrade-insecure-requests");
  });

  it("rejects a nonce that could break out of the header", () => {
    expect(() => buildCsp("x'; script-src *")).toThrow();
  });
});

describe("makeNonce", () => {
  it("is random base64 of 16 bytes", () => {
    const a = makeNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(makeNonce()).not.toBe(a);
  });
});

describe("proxy", () => {
  it("sets a fresh nonce on the request and the same CSP on the response", () => {
    const res1 = proxy(new NextRequest("http://localhost/"));
    const res2 = proxy(new NextRequest("http://localhost/"));
    const csp1 = res1.headers.get("content-security-policy")!;
    expect(nonceOf(csp1)).toBeTruthy();
    expect(nonceOf(csp1)).not.toBe(nonceOf(res2.headers.get("content-security-policy")));
    // Next.js forwards overridden request headers via x-middleware-override-headers.
    expect(res1.headers.get("x-middleware-request-x-nonce")).toBe(nonceOf(csp1));
  });
});

describe("proxy matcher", () => {
  it("covers pages, prefetches and /api, and skips only static files", () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    for (const path of ["/", "/how-its-built", "/api/chat", "/api/nope", "/apixyz"]) expect(pattern.test(path), path).toBe(true);
    for (const path of ["/_next/static/chunks/a.js", "/favicon.ico"]) expect(pattern.test(path), path).toBe(false);
    expect(JSON.stringify(config)).not.toContain("prefetch");
  });

  it("overwrites a client-sent x-nonce", () => {
    const res = proxy(new NextRequest("http://localhost/", { headers: { "x-nonce": "forgedforgedforged12==" } }));
    expect(res.headers.get("x-middleware-request-x-nonce")).not.toBe("forgedforgedforged12==");
  });
});

describe("checkHeaders and pagesFromManifest", () => {
  it("requires every security header and no-store on HTML", () => {
    const good = new Headers([...SECURITY_HEADERS.map((h) => [h.key, h.value] as [string, string]), ["cache-control", "private, no-cache, no-store, max-age=0, must-revalidate"]]);
    expect(checkHeaders(good)).toEqual([]);
    const missing = new Headers([["cache-control", "public, max-age=31536000"], ["x-powered-by", "Next.js"]]);
    const problems = checkHeaders(missing);
    expect(problems).toContain("HTML is cacheable (Cache-Control lacks no-store)");
    expect(problems).toContain("X-Powered-By is sent");
    expect(problems.some((p) => p.includes("X-Frame-Options"))).toBe(true);
  });

  it("lists static pages from the build manifest", () => {
    expect(pagesFromManifest({ "/page": "/", "/x/[slug]/page": "/x/[slug]", "/api/chat/route": "/api/chat", "/_not-found/page": "/_not-found", "/how-its-built/page": "/how-its-built", "/icon.svg/route": "/icon.svg" })).toEqual(["/", "/how-its-built"]);
  });
});

describe("checkPage", () => {
  const csp = buildCsp("abcdefghijklmnop1234==");
  const ok = '<html><head><script nonce="abcdefghijklmnop1234==">x()</script><script src="/a.js" nonce="abcdefghijklmnop1234=="></script></head></html>';

  it("passes when every script carries the nonce", () => {
    expect(checkPage(ok, csp)).toEqual([]);
  });

  it.each([
    ["an inline script without the nonce", ok.replace('<script nonce="abcdefghijklmnop1234==">', "<script>")],
    ["an external script with the wrong nonce", ok.replace('src="/a.js" nonce="abcdefghijklmnop1234=="', 'src="/a.js" nonce="other"')],
    ["an inline event handler", ok.replace("<html>", '<html><button onclick="x()">')],
    ["an inline style attribute", ok.replace("<html>", '<html><div style="color:red">')],
  ])("fails on %s", (_label, html) => {
    expect(checkPage(html, csp).length).toBeGreaterThan(0);
  });

  it.each([
    ["a <style> without the nonce", ok.replace("</head>", "<style>body{}</style></head>")],
    ["a script preload without the nonce", ok.replace("</head>", '<link rel="preload" as="script" href="/b.js"></head>')],
    ["a javascript: URL", ok.replace("<html>", '<html><a href="javascript:alert(1)">x</a>')],
  ])("fails on %s", (_label, html) => {
    expect(checkPage(html, csp).length).toBeGreaterThan(0);
  });

  it("fails when the policy is missing or allows unsafe-inline", () => {
    expect(checkPage(ok, null)).toEqual(["no Content-Security-Policy header"]);
    expect(checkPage(ok, "script-src 'self' 'unsafe-inline' 'nonce-abcdefghijklmnop1234=='")).toContain("script-src allows 'unsafe-inline'");
  });
});
