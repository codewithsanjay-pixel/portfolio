// Runs after `next build`. Fails if the built site contains approval markers,
// private-only tags, wording the owner ruled out,
// or any trace of the local-only example (ADR 005) outside an allowed local build.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FORBIDDEN, GUARD_SENTINEL } from "../lib/safety/forbidden.mjs";
import { exampleBuildAllowed } from "./example-guard.mjs";

export { FORBIDDEN };

// Words that must not ship but are themselves private live in a git-ignored
// file, one per line (lines starting with # are comments). Local builds only.
export function privateTerms(root) {
  const file = join(root, "docs", "private", "forbidden-terms.txt");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

// Server-only secrets. Their real values must never appear anywhere in the build
// output, server or client. Values come from the environment (and .env.local on my
// machine); only the variable name is ever printed.
export const SECRET_NAMES = [
  "OPENAI_API_KEY",
  "DATABASE_URL",
  "DATABASE_URL_READONLY",
  "UPSTASH_REDIS_REST_TOKEN",
  "RATE_LIMIT_HMAC_SECRET",
  "PRIVATE_TERMS",
];

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ name: string, value: string }[]}
 */
export function secretValues(env = process.env) {
  const out = [];
  for (const name of SECRET_NAMES) {
    const value = env[name]?.trim();
    if (!value || value.length < 8) continue;
    out.push({ name, value });
    // A connection string's password alone must not leak either.
    if (name.startsWith("DATABASE_URL")) {
      try {
        const password = decodeURIComponent(new URL(value).password);
        if (password.length >= 8) out.push({ name: `${name} (password)`, value: password });
      } catch {
        // not a URL; the full value is still checked
      }
    }
  }
  return out;
}

// On Vercel these must be present, or the secret scan would pass by checking nothing.
export const REQUIRED_ON_VERCEL = ["OPENAI_API_KEY", "DATABASE_URL_READONLY", "UPSTASH_REDIS_REST_TOKEN"];

/** @param {Record<string, string | undefined>} env */
export function missingRequiredSecrets(env) {
  if (!env.VERCEL_ENV) return [];
  return REQUIRED_ON_VERCEL.filter((name) => !env[name]?.trim());
}

/** @param {Record<string, string | undefined>} env */
export function publicEnvNames(env) {
  return Object.keys(env).filter((name) => name.startsWith("NEXT_PUBLIC_"));
}

const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|wasm|br|gz|zip)$/i;

/**
 * Every file in the build output except Next's cache, any type but binaries.
 * @param {string} buildDir
 * @param {{ name: string, value: string }[]} secrets
 */
export function findSecrets(buildDir, secrets) {
  const hits = new Set();
  if (secrets.length === 0) return [];
  const forms = secrets.flatMap(({ name, value }) => {
    const encoded = encodeURIComponent(value);
    return encoded === value ? [{ name, value }] : [{ name, value }, { name, value: encoded }];
  });
  const files = readdirSync(buildDir)
    .filter((name) => name !== "cache")
    .flatMap((name) => {
      const full = join(buildDir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  for (const file of files) {
    if (BINARY.test(file) || statSync(file).size > 20_000_000) continue;
    const text = readFileSync(file, "utf8");
    for (const { name, value } of forms) {
      if (text.includes(value)) hits.add(`${relative(buildDir, file).replace(/\\/g, "/")}: value of ${name}`);
    }
  }
  return [...hits];
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const EXAMPLE_TRACES = [
  { pattern: /href="\/example/, why: "link to the local-only example" },
  { pattern: /Alex Sample|Example Airline|Example Payments/, why: "example profile text" },
];

const SCANNED = /\.(html|rsc|body|js|json|txt|css|meta)$/;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// React splits adjacent text with <!-- --> in HTML; join it back before matching.
function normalize(text) {
  return text.replace(/<!-- -->/g, "");
}

/**
 * @param {string} buildDir
 * @param {{ allowExample?: boolean, extraTerms?: string[] }} [options]
 */
// The bundled output guard must contain the strings it blocks, so a server-only
// file (server/**/*.js or .json) that carries GUARD_SENTINEL gets only the
// `everywhere` rules. Every other file, including other server code that could
// render text at request time, gets every rule. Chat answers are also checked by
// the same FORBIDDEN rules at runtime (lib/chat/answer.ts).
export function isServerCode(relPath) {
  return relPath.startsWith("server/") && /\.(js|json)$/.test(relPath);
}

export function isGuardBundle(relPath, text) {
  return isServerCode(relPath) && text.includes(GUARD_SENTINEL);
}

/**
 * @param {string} buildDir
 * @param {{ allowExample?: boolean, extraTerms?: string[] }} [options]
 */
export function findForbidden(buildDir, { allowExample = false, extraTerms = [] } = {}) {
  const hits = [];
  const privateRules = extraTerms.map((term) => ({ pattern: new RegExp(escapeRegExp(term), "i"), why: "private term", everywhere: true }));
  const exampleRules = allowExample ? [] : EXAMPLE_TRACES.map((r) => ({ ...r, everywhere: true }));
  const rules = [...FORBIDDEN, ...privateRules, ...exampleRules];

  if (!allowExample && existsSync(join(buildDir, "server", "app", "example"))) {
    hits.push("server/app/example: example routes were built");
  }

  for (const file of [...walk(join(buildDir, "server")), ...walk(join(buildDir, "static"))]) {
    if (!SCANNED.test(file)) continue;
    const rel = relative(buildDir, file).replace(/\\/g, "/");
    const text = normalize(readFileSync(file, "utf8"));
    const guardBundle = isGuardBundle(rel, text);
    for (const { pattern, why, everywhere } of rules) {
      if (guardBundle && !everywhere) continue;
      const m = text.match(pattern);
      if (m) hits.push(`${rel}: "${m[0]}" (${why})`);
    }
  }
  return hits;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.env.BUILD_CHECK_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const buildDir = join(root, ".next");
  if (!existsSync(join(buildDir, "server", "app"))) {
    console.error("Build output check: .next/server/app not found. Run next build first.");
    process.exit(1);
  }
  const allowExample = exampleBuildAllowed(root);
  // exampleBuildAllowed() has loaded .env.local on my machine; on Vercel the values are in the environment.
  // The private word list lives in docs/private locally; on Vercel it comes from PRIVATE_TERMS.
  const fileTerms = privateTerms(root);
  const extraTerms = fileTerms.length > 0 ? fileTerms : (process.env.PRIVATE_TERMS ?? "").split("|").map((t) => t.trim()).filter(Boolean);
  const hits = findForbidden(buildDir, { allowExample, extraTerms });
  const secrets = secretValues();
  hits.push(...findSecrets(buildDir, secrets));
  for (const name of missingRequiredSecrets(process.env)) hits.push(`environment: ${name} is not set on this Vercel build, so the secret scan cannot check it`);
  for (const name of publicEnvNames(process.env)) hits.push(`environment: ${name} would be sent to browsers (NEXT_PUBLIC_ is not allowed)`);
  console.log(`Secret check: ${secrets.length} secret value(s) available to compare against the build output.`);
  if (hits.length > 0) {
    console.error(`Build output check failed. Remove these before shipping:\n${hits.map((h) => `  ${h}`).join("\n")}`);
    process.exit(1);
  }
  console.log("Build output check passed: no markers, ruled-out wording or example traces.");
}
