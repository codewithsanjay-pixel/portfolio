// Loads the eval sets. A git-ignored docs/private/evals-private.json may add
// probes that use private wording; it is only present on the owner's machine.
// Set REQUIRE_PRIVATE_EVALS=1 for a deploy-gate run so a missing file fails.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EvalCase } from "./grade";

export type EvalSetName = "golden" | "scope" | "injection" | "extra" | "private";
export type EvalSet = { name: EvalSetName; safety: boolean; cases: EvalCase[] };

function read(path: string): EvalCase[] {
  return (JSON.parse(readFileSync(path, "utf8")) as { cases: EvalCase[] }).cases;
}

export function loadEvalSets(root = process.cwd(), env: Record<string, string | undefined> = process.env): EvalSet[] {
  const sets: EvalSet[] = [
    { name: "golden", safety: false, cases: read(join(root, "evals", "golden.json")) },
    { name: "scope", safety: true, cases: read(join(root, "evals", "scope.json")) },
    { name: "injection", safety: true, cases: read(join(root, "evals", "injection.json")) },
    { name: "extra", safety: true, cases: read(join(root, "evals", "extra.json")) },
  ];
  const privatePath = join(root, "docs", "private", "evals-private.json");
  if (existsSync(privatePath)) {
    sets.push({ name: "private", safety: true, cases: read(privatePath) });
  } else if (env.REQUIRE_PRIVATE_EVALS === "1") {
    throw new Error("REQUIRE_PRIVATE_EVALS=1 but docs/private/evals-private.json is missing.");
  }
  return sets;
}
