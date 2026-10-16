// docs/private/ holds detail about me that must stay on my machine:
// never tracked by git, never ingested, never in the chat corpus.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CORPUS_SOURCES, assertCorpusSource, isForbiddenSource } from "@/lib/corpus/sources";

const ROOT = process.cwd();
const PRIVATE_DIR = "docs/private";

function git(args: string[]) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("docs/private", () => {
  it("is listed in .gitignore", () => {
    expect(readFileSync(join(ROOT, ".gitignore"), "utf8")).toContain(`/${PRIVATE_DIR}/`);
  });

  it("is ignored by git for any file name", () => {
    const result = git(["check-ignore", "--no-index", "-q", `${PRIVATE_DIR}/ANSWERS.md`]);
    expect(result.status, "git check-ignore should report the path as ignored").toBe(0);
  });

  it("has no files tracked by git, even if added with --force", () => {
    const result = git(["ls-files", "--", PRIVATE_DIR, "docs/ANSWERS.md"]);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("is never an allowed corpus source", () => {
    for (const path of [`${PRIVATE_DIR}/notes.md`, `${PRIVATE_DIR}/answers.md`, "Docs/Private/x.md", `./${PRIVATE_DIR}/x.md`]) {
      expect(isForbiddenSource(path), path).toBe(true);
      expect(() => assertCorpusSource(path), path).toThrow();
    }
    for (const source of CORPUS_SOURCES) {
      expect(source.toLowerCase().startsWith(`${PRIVATE_DIR}/`), source).toBe(false);
    }
  });

  it("is never referenced by app, component, library, content or script code", () => {
    // These name the path only to forbid it.
    const guards = new Set(["lib/corpus/sources.ts", "scripts/check-built-output.mjs"]);
    const offenders = ["app", "components", "lib", "content", "scripts"]
      .flatMap((d) => walk(join(ROOT, d)))
      .map((f) => ({ f, rel: f.slice(ROOT.length + 1).replace(/\\/g, "/") }))
      .filter(({ rel }) => /\.(ts|tsx|js|jsx|mjs|cjs|mts)$/.test(rel) && !guards.has(rel))
      .filter(({ rel }) => !rel.startsWith("app/example/") && !rel.startsWith("content/example/"))
      .filter(({ f }) => /docs[\\/]+private/i.test(readFileSync(f, "utf8")))
      .map(({ rel }) => rel);
    expect(offenders).toEqual([]);
  });

  it("has no line copied into a corpus source", () => {
    const privateLines = walk(join(ROOT, PRIVATE_DIR))
      .flatMap((file) => readFileSync(file, "utf8").split("\n"))
      .map((line) => line.replace(/^[-#\s]+/, "").trim())
      .filter((line) => line.length >= 40);
    for (const source of CORPUS_SOURCES) {
      const text = readFileSync(join(ROOT, source), "utf8");
      const leaked = privateLines.filter((line) => text.includes(line));
      expect(leaked, `${source} contains private lines`).toEqual([]);
    }
  });
});
