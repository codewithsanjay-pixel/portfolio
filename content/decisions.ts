// One row per decision record in docs/adr. Every cell restates what that record says.
// tests/decisions.test.ts fails if a record has no row here, or a row points at a missing or untracked file.
import { repoBranch, repoUrl } from "@/content/site";

export type Decision = {
  adr: string; // file name inside docs/adr
  number: string;
  decision: string;
  chose: string;
  rejected: string;
};

export const NO_ALTERNATIVE = "No alternative recorded";

export const decisionColumns = {
  decision: "Decision",
  chose: "What I chose",
  rejected: "What I did not choose and why",
  record: "Record",
} as const;

// ADRs that record a process rule, not a design choice. Each needs a reason.
export const notDesignDecisions: Record<string, string> = {
  "000-pre-scaffold-commits.md": "Process rule: early docs-only commits skip verify.",
};

export const decisions: Decision[] = [
  {
    adr: "001-project-quality-label.md",
    number: "001",
    decision: "Label for a project with no stated outcome",
    chose: "Call the fourth project item \"Quality\" when the resume gives no outcome. Use \"Result\" only when the resume states one.",
    rejected: "A \"Result\" label on every project. It would suggest more than the resume supports.",
  },
  {
    adr: "002-stack.md",
    number: "002",
    decision: "Stack",
    chose: "Next.js with TypeScript on Vercel, Postgres with pgvector on Neon, Upstash Redis for rate limits, two provider interfaces, and Vitest.",
    rejected: "Supabase. Only plain Postgres is needed, not its extra services.",
  },
  {
    adr: "003-dependency-audit-scope.md",
    number: "003",
    decision: "What the dependency audit blocks",
    chose: "Verify fails on high or critical advisories in packages that ship to production. Dev-only advisories are checked by hand each phase.",
    rejected: "Downgrading eslint-config-next to 14.x, the fix npm suggested. It does not match Next 16, and the flagged package is used only by the linter.",
  },
  {
    adr: "004-expanded-site-structure.md",
    number: "004",
    decision: "Site structure",
    chose: "A scrolling home page, a project page and this page. Expand and collapse use native details and summary.",
    rejected: "Tabs, carousels, floating widgets and headline counters. The record rules them out. Notes are a fixed set of short pieces, not a blog.",
  },
  {
    adr: "005-local-example-profile.md",
    number: "005",
    decision: "Fictional example profile",
    chose: "Keep a fictional comparison profile only on my computer, git-ignored, with build guards that fail if it is present.",
    rejected: NO_ALTERNATIVE,
  },
  {
    adr: "006-eval-sets.md",
    number: "006",
    decision: "Which evals to run and what they expect",
    chose: "The three sets from the spec, plus an extra safety set and a private set kept out of git. Every refusal uses one fixed message.",
    rejected: "Answering only the public half of a mixed question. It can still hint at the other half, so the whole question is refused.",
  },
  {
    adr: "007-openai-provider.md",
    number: "007",
    decision: "Model provider",
    chose: "OpenAI for chat and embeddings, one project with a monthly spending limit, behind lib/embed.ts and lib/llm.ts.",
    rejected: "A provider SDK. Requests use plain fetch against the documented endpoints, so there is no SDK dependency.",
  },
  {
    adr: "008-scope-check-by-retrieval.md",
    number: "008",
    decision: "How the chat checks scope",
    chose: "Reuse the retrieval embedding for the scope check, after a cheap input check that makes no model call.",
    rejected: "A separate scope check before retrieval. It needs its own model call per question, doubles cost and latency, and adds a second prompt to attack.",
  },
  {
    adr: "009-csp-per-request-nonces.md",
    number: "009",
    decision: "Content-Security-Policy",
    chose: "A fresh nonce for every page request, so every page renders per request instead of being prerendered.",
    rejected: "Allowing only the theme script by hash, which would break the other inline scripts Next.js adds. Also \"unsafe-inline\" for scripts, which is ruled out.",
  },
  {
    adr: "010-vercel-platform-public-variable.md",
    number: "010",
    decision: "Vercel's NEXT_PUBLIC_ variables in the build check",
    chose: "Allow names starting NEXT_PUBLIC_VERCEL_, only on a Vercel build. Every other NEXT_PUBLIC_ name still fails the build.",
    rejected: "Switching off Vercel's system variables setting. It also removed VERCEL_ENV, which silently turned off the secrets check.",
  },
  {
    adr: "011-visual-redesign.md",
    number: "011",
    decision: "Public request trace and visual layer",
    chose: "A trace on /api/chat showing six steps with timings and retrieved section headings. Motion is CSS only, with no new dependencies.",
    rejected: NO_ALTERNATIVE,
  },
  {
    adr: "012-streaming-chat-events.md",
    number: "012",
    decision: "Streaming the chat steps",
    chose: "JSON stays the default. With Accept: text/event-stream, the route streams typed events, and the system prompt is a tested dependency.",
    rejected: NO_ALTERNATIVE,
  },
  {
    adr: "013-read-only-mcp-server.md",
    number: "013",
    decision: "MCP server",
    chose: "A stateless, read-only server at /api/mcp with three tools. JSON-RPC is handled by hand, with no new dependencies.",
    rejected: "A separate rate cap, because the chat limiter already bounds it. Sessions and event streams are not built.",
  },
  {
    adr: "014-trust-page-and-break-it.md",
    number: "014",
    decision: "Trust page, \"Try to break it\" panel and hero tiles",
    chose: "A trust page that links each control to its file, a panel that uses only the public injection set, and tiles whose values are computed.",
    rejected: "Hero tiles for a passed count and a CSP, which were dropped as unverifiable or unclear.",
  },
  {
    adr: "015-home-page-density.md",
    number: "015",
    decision: "Home page density",
    chose: "Put the skills explorer in a closed native details element, trim padding on the home page only, and make Focus cards compact.",
    rejected: "A sticky in-page section indicator.",
  },
  {
    adr: "016-eval-results-file.md",
    number: "016",
    decision: "Where eval results on this page come from",
    chose: "npm run eval writes a committed summary file. The table's pass counts and date are read from it.",
    rejected: "Typing the pass counts and date by hand, which can drift from the real latest run.",
  },
  {
    adr: "017-chat-unavailable-state.md",
    number: "017",
    decision: "Chat unavailable banner (proposed)",
    chose: "On a 503 or a failed request, show a status banner with an email link and pause Ask for 5 seconds.",
    rejected: NO_ALTERNATIVE,
  },
];

export function adrPath(d: Pick<Decision, "adr">): string {
  return `docs/adr/${d.adr}`;
}

export function adrUrl(d: Pick<Decision, "adr">): string {
  return `${repoUrl}/blob/${repoBranch}/${adrPath(d)}`;
}
