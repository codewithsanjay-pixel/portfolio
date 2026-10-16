// The eval sets themselves: right size, valid chunk ids, private probes covered,
// and no private wording in the tracked files.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCorpusChunks } from "@/lib/corpus/load";
import { loadEvalSets } from "@/evals/sets";
import { privateTerms } from "@/scripts/check-built-output.mjs";

const sets = Object.fromEntries(loadEvalSets().map((s) => [s.name, s]));
const knownIds = new Set(loadCorpusChunks().map((c) => c.id));

describe("eval sets", () => {
  it("have the sizes from SPEC.md", () => {
    expect(sets.golden.cases).toHaveLength(20);
    expect(sets.scope.cases).toHaveLength(10);
    expect(sets.injection.cases).toHaveLength(10);
  });

  it("have unique case ids", () => {
    const ids = Object.values(sets).flatMap((s) => s.cases.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("golden cases expect answers and cite chunk ids that exist", () => {
    for (const c of sets.golden.cases) {
      expect(c.expect, c.id).toBe("answer");
      expect(c.cites_any?.length, c.id).toBeGreaterThan(0);
      for (const id of c.cites_any ?? []) expect(knownIds.has(id), `${c.id} -> ${id}`).toBe(true);
    }
  });

  it("extra set exists and its answer cases cite chunk ids that exist", () => {
    expect(sets.extra.cases.length).toBeGreaterThan(0);
    for (const c of sets.extra.cases.filter((x) => x.expect === "answer")) {
      for (const id of c.cites_any ?? []) expect(knownIds.has(id), `${c.id} -> ${id}`).toBe(true);
      for (const p of c.cites_prefix ?? []) expect([...knownIds].some((id) => id.startsWith(p)), `${c.id} -> ${p}*`).toBe(true);
      expect(c.must_not_mention?.length, `${c.id} needs must_not_mention`).toBeGreaterThan(0);
    }
  });

  it("scope and injection cases all expect refusal", () => {
    for (const c of [...sets.scope.cases, ...sets.injection.cases]) expect(c.expect, c.id).toBe("refuse");
  });

  it("probe the withheld-detail categories in both scope and injection", () => {
    const wanted: Record<string, string[]> = {
      scope: ["off-topic", "personal-details", "withheld-detail", "system-names", "numbers"],
      injection: ["system-prompt", "role-override", "private-file", "fake-approval", "system-names", "citation-forgery"],
    };
    for (const [name, categories] of Object.entries(wanted)) {
      const probes = new Set(sets[name].cases.map((c) => c.probe));
      for (const category of categories) expect(probes.has(category), `${name} is missing a ${category} probe`).toBe(true);
    }
  });

  // The private words live only in the git-ignored list, so this runs on the owner's machine.
  const terms = privateTerms(process.cwd());
  it.skipIf(terms.length === 0)("keep private wording out of the tracked files", () => {
    for (const file of ["golden.json", "scope.json", "injection.json", "extra.json", "README.md"]) {
      const text = readFileSync(join(process.cwd(), "evals", file), "utf8").toLowerCase();
      for (const term of terms) expect(text.includes(term.toLowerCase()), `${file} contains a private term`).toBe(false);
    }
  });
});
