// The three read-only tools: single source of truth for the MCP server (tools/list,
// tools/call) and the /mcp page. No tool writes anything. Search goes through the
// same retriever as the chat (read-only database role, current-corpus allow-list),
// and every returned text passes the chat's output guards (./guard.ts).
import { howItsBuilt } from "@/content/site";
import { hasUnexpectedCharacters, type ChatDeps } from "../chat/answer";
import { citationLabel } from "../chat/handler";
import { loadResumeChunks } from "../corpus/resume";
import { passesGuards } from "./guard";
import { MAX_QUERY_CHARS, toolContracts, type ToolContract } from "./contracts";

export type ToolContext = { getDeps(): ChatDeps };

// A failure that is safe to show to the caller. Anything else becomes a generic message.
export class ToolError extends Error {}

export type ToolDefinition = ToolContract & {
  run(args: Record<string, unknown>, ctx: ToolContext): Promise<Record<string, unknown>>;
};

export { MAX_QUERY_CHARS };
const MAX_PASSAGES = 5;

// Public section labels, in resume order, from the same chunks the chat may cite.
export function sectionLabels(): string[] {
  const seen = new Set<string>();
  for (const c of loadResumeChunks()) seen.add(citationLabel(c.context));
  return [...seen];
}

function roundScore(score: number): number {
  return Math.round(score * 10) / 10;
}

export function toolDefinitions(): ToolDefinition[] {
  const handlers: Record<string, ToolDefinition["run"]> = {
    search_resume: async (args, ctx) => {
        const query = String(args.query).trim();
        if (!query || hasUnexpectedCharacters(query, "\n\r\t")) throw new ToolError("Please send a plain-text query.");
        const deps = ctx.getDeps();
        const chunks = await deps.retrieve(query);
        const passages = chunks
          .filter((c) => c.score >= deps.minScore)
          .slice(0, MAX_PASSAGES)
          .map((c) => ({ section: citationLabel(c.context), text: c.text, score: roundScore(c.score) }))
          .filter((p) => passesGuards(p.text, deps));
        return { passages };
      },
    get_section: async (args, ctx) => {
        const section = String(args.section);
        const deps = ctx.getDeps();
        const parts = loadResumeChunks()
          .filter((c) => citationLabel(c.context) === section)
          .map((c) => c.text)
          .filter((t) => passesGuards(t, deps));
        if (parts.length === 0) throw new ToolError("No text is available for that section.");
        return { section, text: parts.join("\n") };
      },
    list_evals: async (_args, ctx) => {
        const deps = ctx.getDeps();
        const table = howItsBuilt.sections.find((s) => s.table)?.table;
        const sets = (table?.rows ?? [])
          .map((r) => ({ name: r.set, tests: r.tests, cases: r.cases }))
          .filter((s) => passesGuards(`${s.name}. ${s.tests}`, deps));
        return { sets };
      },
  };
  return toolContracts(sectionLabels()).map((c) => ({ ...c, run: handlers[c.name] }));
}
