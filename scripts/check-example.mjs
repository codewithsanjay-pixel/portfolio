// Fails the build while the fictional example profile is present (ADR 005).
// Runs before `next build` in npm run build; next.config.ts repeats the check.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkExample } from "./example-guard.mjs";

// Repo root, or the folder given by EXAMPLE_GUARD_ROOT (used by tests).
const root = process.env.EXAMPLE_GUARD_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = checkExample(root);

if (!result.ok) {
  console.error(result.message);
  process.exit(1);
}
if (result.present.length > 0) {
  console.warn(`Building WITH the fictional example (${result.present.join(", ")}). Local use only.`);
}
