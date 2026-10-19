// The "How it's built" page may only say things the repository backs up (step 11).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { decisionColumns, decisions } from "@/content/decisions";
import { about, howItsBuilt } from "@/content/site";

const root = process.cwd();
const allFiles = howItsBuilt.sections.flatMap((s) => s.files);

describe("how it's built page", () => {
  it("links only to files that exist", () => {
    for (const file of allFiles) expect(existsSync(join(root, file)), file).toBe(true);
  });

  it("links only to files that git tracks, so the links work on GitHub", () => {
    const result = spawnSync("git", ["ls-files", "--", ...allFiles], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(0);
    const tracked = new Set(result.stdout.split("\n").filter(Boolean));
    for (const file of allFiles) expect(tracked.has(file), `${file} is not tracked by git`).toBe(true);
  });

  it("shows eval counts that match the eval files", () => {
    const table = howItsBuilt.sections.find((s) => s.table)?.table;
    expect(table).toBeDefined();
    const sizes: Record<string, number> = {};
    for (const set of ["golden", "scope", "injection", "extra"]) {
      sizes[set] = (JSON.parse(readFileSync(join(root, "evals", `${set}.json`), "utf8")) as { cases: unknown[] }).cases.length;
    }
    for (const row of table!.rows) {
      expect(row.cases, row.set).toBe(sizes[row.set.toLowerCase()]);
      expect(row.passed, row.set).toBeLessThanOrEqual(row.cases);
    }
    expect(table!.rows.map((r) => r.set.toLowerCase())).toEqual(["golden", "scope", "injection", "extra"]);
  });

  it("names the real runtime dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { dependencies: Record<string, string> };
    expect(Object.keys(pkg.dependencies).sort()).toEqual(["@neondatabase/serverless", "next", "react", "react-dom"]);
  });

  it("uses no em dashes or en dashes in visitor text", () => {
    const text = JSON.stringify([howItsBuilt, about]);
    expect(text).not.toMatch(/[–—]/);
  });
});

describe("how it's built eval table source", () => {
  it("matches evals/public-summary.json", async () => {
    const { evalSummary } = await import("@/lib/evals/summary");
    const table = howItsBuilt.sections.find((s) => s.table)!.table!;
    for (const row of table.rows) {
      expect(row.passed, row.set).toBe(evalSummary.sets[row.set.toLowerCase() as "golden"].passed);
    }
  });

  it("ends with a decisions section that has one row per decision", () => {
    const pageSource = readFileSync(join(root, "app/(site)/how-its-built/page.tsx"), "utf8");
    expect(pageSource).toContain("Decisions and what I rejected");
    expect(decisions.length).toBeGreaterThanOrEqual(17);
    expect(Object.values(decisionColumns)).toEqual(["Decision", "What I chose", "What I did not choose and why", "Record"]);
  });
});
