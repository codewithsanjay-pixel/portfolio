// The public request trace shown next to an answer. It reports what the backend
// did, in the same order as SPEC.md's chat flow, without giving away why a
// refusal happened: every check that runs after the model collapses into one
// "checks" step, so a visitor cannot tell the private-word check from the grounding
// check (the refusal text is one fixed message for the same reason, see types.ts).
import type { ChatResult, ChatStage } from "./types";

export type StepKey = "rate" | "input" | "retrieve" | "scope" | "model" | "checks";
export type StepStatus = "pass" | "stop" | "skipped";

export type PublicTrace = {
  steps: { key: StepKey; status: StepStatus; ms?: number }[];
  // Section headings of the retrieved passages (already public as citations) with
  // their similarity score. Chunk ids and passage text are never included.
  retrieval: { section: string; score: number; cited: boolean }[];
  totalMs: number;
};

export const STEP_ORDER: readonly StepKey[] = ["rate", "input", "retrieve", "scope", "model", "checks"];
const ORDER = STEP_ORDER;

// Called when a step passes (never when one stops the flow), with its time if it has one.
export type StepCallback = (key: StepKey, ms?: number) => void;

// The step where the flow stopped, or null if every step passed.
function stoppedAt(stage: ChatStage | undefined): StepKey | null {
  switch (stage) {
    case "input":
      return "input";
    case "scope":
      return "scope";
    case "model":
      return "model";
    case "citations":
    case "guard":
    case "private":
    case "grounding":
      return "checks";
    default:
      return null;
  }
}

export function buildTrace(
  result: ChatResult,
  describe: (items: { id: string; score: number }[], cited: readonly string[]) => PublicTrace["retrieval"],
  totalMs: number,
): PublicTrace {
  const stop = stoppedAt(result.stage);
  const stopIndex = stop ? ORDER.indexOf(stop) : ORDER.length;
  const t = result.trace;
  const steps = ORDER.map((key, i) => {
    const status: StepStatus = i < stopIndex ? "pass" : i === stopIndex ? "stop" : "skipped";
    const ms = key === "retrieve" ? t?.retrieveMs : key === "model" ? t?.modelMs : undefined;
    return status === "skipped" || ms === undefined ? { key, status } : { key, status, ms };
  });
  // Refusals show no retrieval rows, and the total is rounded, so the trace gives
  // a visitor nothing to tune a question against the scope threshold or the checks.
  const retrieval = result.refused ? [] : describe(t?.retrieved ?? [], result.citations);
  return { steps, retrieval, totalMs: Math.round(totalMs / 50) * 50 };
}
