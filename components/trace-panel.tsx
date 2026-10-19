// The request trace under an answer: what the backend did for this question, step
// by step, with timings and the retrieval scores. Data comes from the route
// (lib/chat/trace.ts); everything is validated here and rendered as plain text.

export const TRACE_STEPS = ["rate", "input", "retrieve", "scope", "model", "checks"] as const;
export type TraceKey = (typeof TRACE_STEPS)[number];
export type TraceStatus = "pass" | "stop" | "skipped";
export type Trace = {
  steps: { key: TraceKey; status: TraceStatus; ms?: number }[];
  retrieval: { section: string; score: number; cited: boolean }[];
  totalMs: number;
};

const LABELS: Record<TraceKey, string> = {
  rate: "Rate limit",
  input: "Input check",
  retrieve: "Retrieval",
  scope: "Scope check",
  model: "Model",
  checks: "Answer checks",
};
const STATUS_WORD: Record<TraceStatus, string> = { pass: "passed", stop: "stopped here", skipped: "not run" };

const MAX_ROWS = 10;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// Anything that does not match the expected shape is dropped, so a bad response
// can never put unexpected content on the page.
export function traceFrom(value: unknown): Trace | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { steps?: unknown; retrieval?: unknown; totalMs?: unknown };
  if (!Array.isArray(v.steps) || v.steps.length !== TRACE_STEPS.length || !isNum(v.totalMs)) return null;
  const steps: Trace["steps"] = [];
  for (const [i, s] of v.steps.entries()) {
    const step = s as { key?: unknown; status?: unknown; ms?: unknown };
    if (step?.key !== TRACE_STEPS[i]) return null;
    if (step.status !== "pass" && step.status !== "stop" && step.status !== "skipped") return null;
    steps.push({ key: TRACE_STEPS[i], status: step.status, ...(isNum(step.ms) ? { ms: Math.max(0, Math.round(step.ms)) } : {}) });
  }
  const retrieval = (Array.isArray(v.retrieval) ? v.retrieval : [])
    .filter((r): r is Trace["retrieval"][number] => !!r && typeof r.section === "string" && r.section.length <= 200 && isNum(r.score) && typeof r.cited === "boolean")
    .slice(0, MAX_ROWS)
    .map((r) => ({ section: r.section, score: Math.min(1, Math.max(0, r.score)), cited: r.cited }));
  return { steps, retrieval, totalMs: Math.max(0, Math.round(v.totalMs)) };
}

export function TracePanel({ trace }: { trace: Trace }) {
  return (
    <details className="trace" open>
      <summary className="trace-summary">
        <span>Request trace</span>
        <span className="trace-total">{trace.totalMs} ms</span>
      </summary>
      <ol className="trace-steps">
        {trace.steps.map((s, i) => (
          <li key={s.key} className={`trace-step trace-${s.status} d${i + 1}`}>
            <span className="trace-dot" aria-hidden="true" />
            <span className="trace-name">{LABELS[s.key]}</span>
            <span className="trace-state">{STATUS_WORD[s.status]}</span>
            {s.ms !== undefined ? <span className="trace-ms">{s.ms} ms</span> : null}
          </li>
        ))}
      </ol>
      {trace.retrieval.length > 0 ? (
        <>
          <p className="trace-label">Retrieved passages, by similarity</p>
          <ul className="trace-hits">
            {trace.retrieval.map((r, i) => (
              <li key={`${r.section}-${i}`} className={`trace-hit d${Math.min(i + 1, 6)}`}>
                <span className="trace-hit-name">{r.section}</span>
                <meter className="trace-meter" min={0} max={1} value={r.score} aria-hidden="true" />
                <span className="trace-score">{r.score.toFixed(1)}</span>
                {r.cited ? <span className="trace-cited">cited</span> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </details>
  );
}
