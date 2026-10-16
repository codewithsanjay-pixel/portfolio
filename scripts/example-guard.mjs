// Shared guard for the local-only fictional example (ADR 005).
// Used by scripts/check-example.mjs (npm run build), next.config.ts (every
// `next build`) and scripts/check-built-output.mjs (after the build).
import { existsSync } from "node:fs";
import { join } from "node:path";

export const EXAMPLE_DIRS = ["content/example", "app/example"];

// On Vercel or CI the override is ignored: those builds must never include the example.
export function isHostedBuild(env = process.env) {
  return Boolean(env.VERCEL || env.VERCEL_ENV || env.CI);
}

function loadLocalEnv(root, env) {
  if (isHostedBuild(env) || typeof process.loadEnvFile !== "function") return;
  const file = join(root, ".env.local");
  if (!existsSync(file)) return;
  try {
    process.loadEnvFile(file);
  } catch {
    // Unreadable .env.local: fall through with the existing environment.
  }
}

// True only for a local build where I set ALLOW_EXAMPLE_BUILD=true.
export function exampleBuildAllowed(root, env = process.env) {
  loadLocalEnv(root, env);
  return !isHostedBuild(env) && env.ALLOW_EXAMPLE_BUILD === "true";
}

export function checkExample(root, env = process.env) {
  loadLocalEnv(root, env);

  const present = EXAMPLE_DIRS.filter((dir) => existsSync(join(root, dir)));
  if (present.length === 0) return { ok: true, present };

  if (isHostedBuild(env)) {
    return {
      ok: false,
      present,
      message:
        `Build stopped: example profile folders found (${present.join(", ")}) in a Vercel or CI build.\n` +
        "The fictional example must never ship. ALLOW_EXAMPLE_BUILD is ignored here.",
    };
  }

  if (env.ALLOW_EXAMPLE_BUILD !== "true") {
    return {
      ok: false,
      present,
      message:
        `Build stopped: example profile folders found (${present.join(", ")}).\n` +
        "They hold fictional content and must not ship. Delete them, or set\n" +
        "ALLOW_EXAMPLE_BUILD=true in .env.local for a local-only build.",
    };
  }

  return { ok: true, present };
}
