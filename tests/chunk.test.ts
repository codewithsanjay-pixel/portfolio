import { describe, expect, it } from "vitest";
import { BLOCKED, chunkResume, slug } from "@/lib/corpus/chunk";
import { loadCorpusChunks } from "@/lib/corpus/load";
import { FORBIDDEN } from "@/scripts/check-built-output.mjs";

const SAMPLE = `# Resume
Name: Test Person
Location: Somewhere
NOTE FOR CLAUDE CODE: instructions here.

## Summary
- Built search systems for teams.
- Has 9 years [CONFIRM: not approved] of experience.

## Experience
### Engineer. American Airlines. Remote. 2025 to present
- Built RAG pipelines over documents.
- Held back bullet. [confirm: lowercase marker]
### Developer. American Express. City. 2021 to 2023
- Built fraud scoring services.
### Held role somewhere [CONFIRM: hold back this whole role]
- Hidden bullet under a held-back heading.

## Detail from me
### Retrieval (American Airlines)
- [PUBLIC-GENERAL] Used a cross-encoder to re-rank.
- [INTERVIEW-ONLY] Private story.
- [INTERVIEW ONLY: reason] Variant tag story.
- [PUBLIC-GENERAL] Public but unconfirmed. [CONFIRM: check]
- Untagged item.

## Projects
### Knowledge Assistant: RAG and agents
Built an assistant for employees.
Second line of the paragraph.

Confirmed: employer work. Describe in general terms only.

## Decisions about what is public
1. Internal notes that never go in the chat. [CONFIRM]
`;

describe("chunkResume", () => {
  const chunks = chunkResume(SAMPLE);
  const ids = chunks.map((c) => c.id);
  const all = chunks.map((c) => `${c.context} ${c.text}`).join("\n");

  it("builds stable, readable ids", () => {
    expect(ids).toEqual([
      "profile",
      "summary-built-search-systems-for-teams",
      "aa-role",
      "aa-built-rag-pipelines-over-documents",
      "amex-role",
      "amex-built-fraud-scoring-services",
      "detail-retrieval-american-airlines-used-a-cross-encoder-to-re-rank",
      "project-knowledge-assistant",
    ]);
  });

  it("skips marked bullets, held-back headings, untagged detail and meta text", () => {
    for (const leaked of [
      "9 years",
      "Held back bullet",
      "Held role",
      "Hidden bullet",
      "Private story",
      "Variant tag story",
      "Public but unconfirmed",
      "Untagged item",
      "NOTE FOR",
      "Confirmed:",
      "Internal notes",
    ]) {
      expect(all.includes(leaked), leaked).toBe(false);
    }
  });

  it("fails loudly on a marker line that would not hold back anything", () => {
    const md = "## Experience\n### Dev. American Express. 2021\n[CONFIRM: wording for this role]\n- Built things.";
    expect(() => chunkResume(md)).toThrow(/does not hold back anything/);
  });

  it("recognises marker variants", () => {
    for (const marker of ["[CONFIRM", "[ confirm: x]", "[INTERVIEW-ONLY]", "[INTERVIEW ONLY: why]", "[interview_only]"]) {
      expect(BLOCKED.test(marker), marker).toBe(true);
    }
  });

  it("strips the public tag and keeps context", () => {
    const detail = chunks.find((c) => c.id.startsWith("detail-"))!;
    expect(detail.text).toBe("Used a cross-encoder to re-rank.");
    expect(detail.context).toBe("Detail from me > Retrieval (American Airlines)");
  });

  it("joins a project paragraph into one chunk", () => {
    expect(chunks.find((c) => c.id === "project-knowledge-assistant")!.text).toBe(
      "Built an assistant for employees. Second line of the paragraph.",
    );
  });

  it("rejects duplicate ids", () => {
    expect(() => chunkResume("## Summary\n- Same opening words here today.\n- Same opening words here today again.")).toThrow(/Duplicate/);
  });

  it("slugs consistently", () => {
    expect(slug("Built and optimized RAG pipelines, quickly")).toBe("built-and-optimized-rag-pipelines");
  });
});

describe("real corpus", () => {
  const chunks = loadCorpusChunks();

  it("has unique ids and no empty chunks", () => {
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
    for (const c of chunks) expect(c.text.length, c.id).toBeGreaterThan(10);
  });

  it("contains nothing the site may not show", () => {
    const all = chunks.map((c) => `${c.context} ${c.text}`).join("\n");
    for (const { pattern, why } of FORBIDDEN) expect(pattern.test(all), why).toBe(false);
    expect(all.includes("enum-based"), "enum fix detail was approved on 2026-10-09 and must be in the corpus").toBe(true);
  });

  it("keeps the frontend skills after the [CONFIRM] split", () => {
    expect(chunks.find((c) => c.id === "skills-frontend")?.text).toContain("React");
  });
});
