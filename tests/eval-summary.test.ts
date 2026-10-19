// The public eval summary (ADR 016): right shape, public sets only, counts that match the files.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { howItsBuilt } from "@/content/site";
import { evalSummary, formatRunDate, parseEvalSummary, PUBLIC_SETS } from "@/lib/evals/summary";

const root = process.cwd();
const file = JSON.parse(readFileSync(join(root, "evals", "public-summary.json"), "utf8")) as Record<string, unknown>;

describe("evals/public-summary.json", () => {
  it("has the expected shape and parses", () => {
    expect(Object.keys(file).sort()).toEqual(["at", "commit", "sets"]);
    expect(() => parseEvalSummary(file)).not.toThrow();
  });

  it("holds only the four public sets and only counts", () => {
    const sets = file.sets as Record<string, Record<string, unknown>>;
    expect(Object.keys(sets).sort()).toEqual([...PUBLIC_SETS].sort());
    for (const set of Object.values(sets)) expect(Object.keys(set).sort()).toEqual(["cases", "passed"]);
    expect(JSON.stringify(file)).not.toMatch(/private|question|answer/i);
  });

  it("has case counts equal to the eval files and passed within range", () => {
    for (const name of PUBLIC_SETS) {
      const size = (JSON.parse(readFileSync(join(root, "evals", `${name}.json`), "utf8")) as { cases: unknown[] }).cases.length;
      expect(evalSummary.sets[name].cases, name).toBe(size);
      expect(evalSummary.sets[name].passed, name).toBeLessThanOrEqual(size);
    }
  });

  it("rejects a private set, extra keys and impossible counts", () => {
    const sets = file.sets as object;
    expect(() => parseEvalSummary({ ...file, sets: { ...sets, private: { cases: 1, passed: 1 } } })).toThrow();
    expect(() => parseEvalSummary({ ...file, extra: 1 })).toThrow();
    expect(() => parseEvalSummary({ ...file, sets: { ...sets, golden: { cases: 2, passed: 3 } } })).toThrow();
  });
});

describe("how it's built eval table", () => {
  const table = howItsBuilt.sections.find((s) => s.table)!.table!;

  it("takes its passed counts from the summary", () => {
    for (const row of table.rows) {
      const set = evalSummary.sets[row.set.toLowerCase() as (typeof PUBLIC_SETS)[number]];
      expect(row.cases, row.set).toBe(set.cases);
      expect(row.passed, row.set).toBe(set.passed);
    }
  });

  it("takes its caption date from the summary, in Chicago time", () => {
    expect(table.caption).toBe(`Chat eval results, last full run on ${formatRunDate(evalSummary.at)}`);
    expect(formatRunDate("2026-10-19T17:45:38.982Z")).toBe("19 October 2026");
    expect(formatRunDate("2026-10-20T02:30:00.000Z")).toBe("19 October 2026");
  });
});
