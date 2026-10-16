// The build guard from ADR 005, run against throwaway folders.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = join(process.cwd(), "scripts", "check-example.mjs");
let dirs: string[] = [];

function sandbox(withExample: boolean, envLocal?: string): string {
  const dir = mkdtempSync(join(tmpdir(), "check-example-"));
  dirs.push(dir);
  if (withExample) mkdirSync(join(dir, "app", "example"), { recursive: true });
  if (envLocal !== undefined) writeFileSync(join(dir, ".env.local"), envLocal);
  return dir;
}

function run(root: string, env: Record<string, string> = {}) {
  const clean = { ...process.env };
  for (const key of ["ALLOW_EXAMPLE_BUILD", "CI", "VERCEL", "VERCEL_ENV"]) delete clean[key];
  return spawnSync(process.execPath, [SCRIPT], {
    env: { ...clean, EXAMPLE_GUARD_ROOT: root, ...env },
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
  dirs = [];
});

describe("check-example, local builds", () => {
  it("passes when no example folders exist", () => {
    expect(run(sandbox(false)).status).toBe(0);
  });

  it("fails when an example folder exists", () => {
    const result = run(sandbox(true));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Build stopped");
  });

  it("passes with ALLOW_EXAMPLE_BUILD=true in the environment", () => {
    expect(run(sandbox(true), { ALLOW_EXAMPLE_BUILD: "true" }).status).toBe(0);
  });

  it("passes with ALLOW_EXAMPLE_BUILD=true in .env.local", () => {
    expect(run(sandbox(true, "ALLOW_EXAMPLE_BUILD=true\n")).status).toBe(0);
  });

  it("fails for any value other than true", () => {
    expect(run(sandbox(true), { ALLOW_EXAMPLE_BUILD: "yes" }).status).toBe(1);
  });
});

describe("check-example, Vercel and CI builds", () => {
  const hostedEnvs: Record<string, string>[] = [{ VERCEL: "1" }, { VERCEL_ENV: "production" }, { CI: "true" }];
  for (const hosted of hostedEnvs) {
    const name = Object.keys(hosted)[0];

    it(`ignores the override when ${name} is set`, () => {
      const result = run(sandbox(true, "ALLOW_EXAMPLE_BUILD=true\n"), { ...hosted, ALLOW_EXAMPLE_BUILD: "true" });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Vercel or CI");
    });

    it(`passes when ${name} is set and no example exists`, () => {
      expect(run(sandbox(false), hosted).status).toBe(0);
    });
  }
});
