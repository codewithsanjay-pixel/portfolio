// Keeps the local-only fictional example (ADR 005) away from the real site.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { CORPUS_SOURCES, assertCorpusSource, isForbiddenSource } from "@/lib/corpus/sources";

const ROOT = process.cwd();
const EXAMPLE_DIRS = ["content/example", "app/example"];
const EXAMPLE_MARKERS = ["Alex Sample", "Example Airline", "Example Payments"];
const REAL_IDENTIFIERS = [
  "Kandimalla",
  "Sanjay",
  "American Airlines",
  "American Express",
  "Amex",
  "codewithsanjay",
  "linkedin.com/in/sanjay",
];
// Committed files allowed to name the example (they describe or test it).
const MARKER_ALLOWLIST = new Set([
  "tests/example-isolation.test.ts",
  "tests/pages.test.tsx",
  "tests/check-built-output.test.ts",
  "scripts/check-built-output.mjs",
  "docs/adr/005-local-example-profile.md",
]);
// Folders scanned on disk, tracked or not, so a renamed copy is caught too.
const DISK_SCAN_DIRS = ["app", "components", "lib", "content", "scripts", "prototype", "docs"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);
const TEXT_FILE = /\.(ts|tsx|js|jsx|mjs|cjs|mts|cts|md|mdx|json|html|css)$/;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function rel(path: string): string {
  return relative(ROOT, path).replace(/\\/g, "/");
}

function isInExample(path: string): boolean {
  const r = rel(path).toLowerCase();
  return EXAMPLE_DIRS.some((dir) => r.startsWith(`${dir}/`));
}

function git(args: string[]): string {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
}

describe("chat corpus", () => {
  it("lists no example paths", () => {
    for (const source of CORPUS_SOURCES) {
      expect(isForbiddenSource(source), source).toBe(false);
    }
  });

  it("rejects example paths even when asked directly", () => {
    expect(() => assertCorpusSource("content/example/profile.ts")).toThrow();
    expect(() => assertCorpusSource("app/example/page.tsx")).toThrow();
    expect(() => assertCorpusSource("docs/private/notes.md")).toThrow();
    expect(() => assertCorpusSource("docs/CONTENT.md")).toThrow();
    expect(() => assertCorpusSource("docs/../content/example/profile.ts")).toThrow();
    expect(assertCorpusSource("docs/RESUME.md")).toBe("docs/RESUME.md");
  });

  it("contains no example text", () => {
    for (const source of CORPUS_SOURCES) {
      const text = readFileSync(join(ROOT, source), "utf8");
      for (const marker of EXAMPLE_MARKERS) {
        expect(text.includes(marker), `${source} contains "${marker}"`).toBe(false);
      }
    }
  });
});

describe("real code", () => {
  it("does not reference the example folders in any import, require or string", () => {
    const rootFiles = readdirSync(ROOT)
      .map((name) => join(ROOT, name))
      .filter((f) => statSync(f).isFile() && /\.(ts|tsx|js|mjs|cjs|mts)$/.test(f));
    // These name the example paths only to guard against them.
    const guards = new Set(["lib/corpus/sources.ts", "scripts/example-guard.mjs", "scripts/check-built-output.mjs"]);
    const codeFiles = [...rootFiles, ...["app", "components", "lib", "content", "scripts"].flatMap((d) => walk(join(ROOT, d)))]
      .filter((f) => !isInExample(f) && /\.(ts|tsx|js|jsx|mjs|cjs|mts|cts)$/.test(f))
      .filter((f) => !guards.has(rel(f)));
    const absolute = /["'`][^"'`]*(content|app)\/example\b/i;
    const relativeRef = /["'`]\.\.?\/(\.\.\/)*example(?=["'`/])/i;
    const offenders = codeFiles
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        return absolute.test(src) || relativeRef.test(src);
      })
      .map(rel);
    expect(offenders).toEqual([]);
  });
});

describe("example folders", () => {
  const files = EXAMPLE_DIRS.flatMap((d) => walk(join(ROOT, d)));

  it.skipIf(files.length === 0)("never mention the real person, employers or links", () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const id of REAL_IDENTIFIERS) {
        if (text.includes(id)) hits.push(`${rel(file)}: ${id}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("are listed in .gitignore", () => {
    const ignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
    for (const dir of EXAMPLE_DIRS) {
      expect(ignore).toContain(`/${dir}/`);
    }
  });

  it("have no files tracked by git, even if added with --force", () => {
    expect(git(["ls-files", "--", ...EXAMPLE_DIRS]).trim()).toBe("");
  });
});

describe("example text outside its folders", () => {
  it("is not in any tracked file", () => {
    const tracked = git(["ls-files"]).split("\n").filter(Boolean);
    const hits: string[] = [];
    for (const path of tracked) {
      if (MARKER_ALLOWLIST.has(path) || !TEXT_FILE.test(path) || !existsSync(join(ROOT, path))) continue;
      const text = readFileSync(join(ROOT, path), "utf8");
      for (const marker of EXAMPLE_MARKERS) {
        if (text.includes(marker)) hits.push(`${path}: ${marker}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("is not in a renamed or copied folder on disk", () => {
    const hits: string[] = [];
    for (const file of DISK_SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)))) {
      const path = rel(file);
      if (isInExample(file) || MARKER_ALLOWLIST.has(path) || !TEXT_FILE.test(path)) continue;
      const text = readFileSync(file, "utf8");
      for (const marker of EXAMPLE_MARKERS) {
        if (text.includes(marker)) hits.push(`${path}: ${marker}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
