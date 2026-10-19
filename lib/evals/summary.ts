// Reads evals/public-summary.json, which `npm run eval` writes after a full run.
// The site shows these numbers and this date, so nobody types them by hand (ADR 016).
// The file holds counts for the four public sets only: no questions, ids or answers.
import raw from "@/evals/public-summary.json";

export const PUBLIC_SETS = ["golden", "scope", "injection", "extra"] as const;
export type PublicSetName = (typeof PUBLIC_SETS)[number];
export type SetResult = { cases: number; passed: number };
export type EvalSummary = { at: string; commit: string | null; sets: Record<PublicSetName, SetResult> };

const isCount = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

export function parseEvalSummary(value: unknown): EvalSummary {
  const v = value as { at?: unknown; commit?: unknown; sets?: Record<string, { cases?: unknown; passed?: unknown }> } | null;
  if (!v || typeof v !== "object") throw new Error("eval summary: not an object");
  if (Object.keys(v).sort().join() !== "at,commit,sets") throw new Error("eval summary: unexpected keys");
  if (typeof v.at !== "string" || Number.isNaN(Date.parse(v.at))) throw new Error("eval summary: bad date");
  if (v.commit !== null && (typeof v.commit !== "string" || !/^[0-9a-f]{4,40}$/.test(v.commit))) throw new Error("eval summary: bad commit");
  const sets = v.sets;
  if (!sets || typeof sets !== "object" || Object.keys(sets).sort().join() !== [...PUBLIC_SETS].sort().join()) {
    throw new Error("eval summary: sets must be exactly the four public sets");
  }
  for (const name of PUBLIC_SETS) {
    const s = sets[name];
    if (!s || Object.keys(s).sort().join() !== "cases,passed") throw new Error(`eval summary: bad set ${name}`);
    if (!isCount(s.cases) || !isCount(s.passed) || s.passed > s.cases) throw new Error(`eval summary: bad counts for ${name}`);
  }
  return value as EvalSummary;
}

export const evalSummary: EvalSummary = parseEvalSummary(raw);

// "19 October 2026", in the owner's time zone so the date does not shift with the server.
export function formatRunDate(at: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Chicago", day: "numeric", month: "long", year: "numeric" }).format(new Date(at));
}
