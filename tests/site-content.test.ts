// Site copy must come from docs/CONTENT.md word for word, and never carry markers.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FORBIDDEN } from "@/scripts/check-built-output.mjs";
import * as site from "@/content/site";

const CONTENT = readFileSync(join(process.cwd(), "docs", "CONTENT.md"), "utf8");

describe("content/site.ts", () => {
  it("has no markers or ruled-out wording", () => {
    const all = JSON.stringify(site);
    for (const { pattern, why } of FORBIDDEN) {
      expect(pattern.test(all), why).toBe(false);
    }
  });

  it("uses CONTENT.md copy word for word", () => {
    const copy = [
      site.person.headline,
      site.person.subline,
      site.person.description,
      ...site.focus.map((f) => f.body),
      ...site.timeline.flatMap((e) => [e.summary, ...(e.groups ?? []).flatMap((g) => g.items)]),
      site.eka.cardSummary,
      site.eka.label,
      site.eka.problem,
      ...site.eka.parts.map((p) => p.value),
      site.eka.quality,
      site.eka.leavesOut,
      site.chat.refusal,
      site.chat.hint,
      site.chat.pending,
      site.chat.fallbackError,
      ...site.chat.errors,
      site.howItsBuilt.intro,
      site.howItsBuilt.dataNote,
      ...site.howItsBuilt.sections.flatMap((s) => [s.title, ...s.paragraphs, ...(s.points ?? []), ...(s.after ?? []), ...(s.table ? [s.table.note, ...s.table.rows.map((r) => r.tests)] : [])]),
      ...site.chat.starters,
    ];
    const missing = copy.filter((line) => !CONTENT.includes(line));
    expect(missing).toEqual([]);
  });
});
