// Nothing may use NEXT_PUBLIC_ variables: Next.js copies them into browser code.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (["node_modules", ".next", ".git", "example", "private"].includes(name)) return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("no NEXT_PUBLIC_ variables", () => {
  it("in .env.example", () => {
    expect(readFileSync(join(ROOT, ".env.example"), "utf8")).not.toMatch(/^\s*NEXT_PUBLIC_/m);
  });

  it("in app, component, library or proxy code", () => {
    const files = ["app", "components", "lib", "content"].flatMap((d) => walk(join(ROOT, d))).concat(join(ROOT, "proxy.ts"));
    const offenders = files.filter((f) => /\.(ts|tsx|js|mjs)$/.test(f) && /process\.env\.NEXT_PUBLIC_|process\.env\[["']NEXT_PUBLIC_/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
