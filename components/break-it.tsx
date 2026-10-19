"use client";

// "Try to break it" (ADR 014). Sends one public injection eval question at a time
// to POST /api/chat and shows what the eval expects next to what happened.
// Same safety rules as components/chat-panel.tsx:
// - Only { question } is sent; no history, no retries; one request at a time, with a timeout.
// - The response shape is validated; everything is rendered as plain text through React.
// - Refusals show the fixed refusal text and errors only the route's known messages.
// - Nothing is stored: no localStorage, no analytics.
import { useRef, useState } from "react";
import { TracePanel, traceFrom, type Trace } from "./trace-panel";

export type BreakItCase = { id: string; question: string; expect: "refuse" | "answer"; probe?: string };

export type BreakItText = {
  listLabel: string;
  expectedLabel: string;
  expected: { refuse: string; answer: string };
  actualLabel: string;
  actual: { refused: string; answered: string; error: string };
  matches: string;
  differs: string;
  send: string;
  sending: string;
  sourcesLabel: string;
  refusal: string;
  // The only error messages the route sends (docs/CONTENT.md).
  errors: readonly string[];
  fallbackError: string;
};

type Citation = { id: string; section: string };
type Outcome =
  | { kind: "refused"; text: string; trace?: Trace }
  | { kind: "answered"; text: string; citations: Citation[]; trace?: Trace }
  | { kind: "error"; text: string };

const MAX_ANSWER_CHARS = 2_000;
const MAX_CITATIONS = 10;
const MAX_QUESTION_CHARS = 500;
const TIMEOUT_MS = 30_000;

function citationsFrom(value: unknown): Citation[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c): c is Citation => !!c && typeof c.id === "string" && typeof c.section === "string" && c.section.length <= 200)
    .slice(0, MAX_CITATIONS);
}

export function BreakIt({ cases, text }: { cases: readonly BreakItCase[]; text: BreakItText }) {
  const [results, setResults] = useState<Record<string, Outcome>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function run(c: BreakItCase) {
    // A ref, not state: it blocks a second request immediately, before any re-render.
    if (inFlight.current || c.question.length > MAX_QUESTION_CHARS) return;
    inFlight.current = true;
    setPendingId(c.id);
    let outcome: Outcome;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: c.question }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const data: unknown = await res.json().catch(() => null);
      const body = (data ?? {}) as { refused?: unknown; answer?: unknown; citations?: unknown; trace?: unknown; error?: unknown };
      if (res.ok && body.refused === true) {
        outcome = { kind: "refused", text: text.refusal, trace: traceFrom(body.trace) ?? undefined };
      } else if (res.ok && typeof body.answer === "string" && body.answer.length > 0 && body.answer.length <= MAX_ANSWER_CHARS) {
        outcome = { kind: "answered", text: body.answer, citations: citationsFrom(body.citations), trace: traceFrom(body.trace) ?? undefined };
      } else {
        const known = typeof body.error === "string" && text.errors.includes(body.error);
        outcome = { kind: "error", text: known ? (body.error as string) : text.fallbackError };
      }
    } catch {
      outcome = { kind: "error", text: text.fallbackError };
    }
    setResults((prev) => ({ ...prev, [c.id]: outcome }));
    setPendingId(null);
    inFlight.current = false;
  }

  return (
    <ul className="bi-list" aria-label={text.listLabel}>
      {cases.map((c) => {
        const out = results[c.id];
        const matches = out && out.kind !== "error" ? (out.kind === "refused") === (c.expect === "refuse") : null;
        return (
          <li key={c.id} className="bi-item" data-case={c.id}>
            <button type="button" className="bi-ask" disabled={pendingId !== null} onClick={() => void run(c)}>
              <span className="bi-question">{c.question}</span>
              <span className="bi-go">{pendingId === c.id ? text.sending : text.send}</span>
            </button>
            <p className="bi-meta">
              <span className="bi-expected">
                {text.expectedLabel}: {text.expected[c.expect]}
              </span>
              {out ? (
                <span className={`bi-actual bi-${out.kind}`}>
                  {text.actualLabel}: {text.actual[out.kind]}
                </span>
              ) : null}
              {matches !== null ? <span className={matches ? "bi-ok" : "bi-diff"}>{matches ? text.matches : text.differs}</span> : null}
            </p>
            {out ? (
              <div className="bi-result" role="status">
                <p className="bi-text">{out.text}</p>
                {out.kind === "answered" && out.citations.length > 0 ? (
                  <>
                    <p className="msg-label">{text.sourcesLabel}</p>
                    <ul className="citations">
                      {out.citations.map((x) => (
                        <li key={x.id}>{x.section}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {out.kind !== "error" && out.trace ? <TracePanel trace={out.trace} /> : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
