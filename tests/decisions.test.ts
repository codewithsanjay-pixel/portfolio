// The decisions table must match docs/adr: every record listed, every link real.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { adrPath, adrUrl, decisionColumns, decisions, NO_ALTERNATIVE, notDesignDecisions } from "@/content/decisions";
import { repoBranch, repoUrl } from "@/content/site";

const root = process.cwd();
const adrFiles = readdirSync(join(root, "docs", "adr")).filter((f) => f.endsWith(".md")).sort();
const words = (s: string) => s.trim().split(/\s+/).length;

describe("decisions table", () => {
  it("covers every ADR file, so a new ADR without a row fails", () => {
    const listed = [...decisions.map((d) => d.adr), ...Object.keys(notDesignDecisions)].sort();
    expect(listed).toEqual(adrFiles);
    expect(new Set(decisions.map((d) => d.adr)).size).toBe(decisions.length);
  });

  it("only skips ADRs with a stated reason", () => {
    for (const [file, reason] of Object.entries(notDesignDecisions)) {
      expect(reason.length, file).toBeGreaterThan(10);
      expect(decisions.some((d) => d.adr === file), file).toBe(false);
    }
  });

  it("links only to ADR files that exist and are tracked by git", () => {
    const paths = decisions.map(adrPath);
    for (const p of paths) expect(existsSync(join(root, p)), p).toBe(true);
    const result = spawnSync("git", ["ls-files", "--", ...paths], { cwd: root, encoding: "utf8" });
    expect(result.status).toBe(0);
    const tracked = new Set(result.stdout.split("\n").filter(Boolean));
    for (const p of paths) expect(tracked.has(p), `${p} is not tracked by git`).toBe(true);
  });

  it("builds record links from repoUrl and repoBranch", () => {
    for (const d of decisions) expect(adrUrl(d)).toBe(`${repoUrl}/blob/${repoBranch}/docs/adr/${d.adr}`);
  });

  it("numbers each row to match its file name", () => {
    for (const d of decisions) expect(d.adr.startsWith(`${d.number}-`), d.adr).toBe(true);
  });

  it("keeps each cell short, plain and filled in", () => {
    for (const d of decisions) {
      for (const cell of [d.decision, d.chose, d.rejected]) {
        expect(cell.trim().length, d.adr).toBeGreaterThan(0);
        expect(words(cell), `${d.adr}: ${cell}`).toBeLessThan(35);
      }
    }
  });

  it("uses no em dashes or en dashes", () => {
    expect(JSON.stringify([decisions, decisionColumns])).not.toMatch(/[–—]/);
  });

  it("says plainly when no alternative was recorded", () => {
    expect(NO_ALTERNATIVE).toBe("No alternative recorded");
    expect(decisions.some((d) => d.rejected === NO_ALTERNATIVE)).toBe(true);
  });
});
