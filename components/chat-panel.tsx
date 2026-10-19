"use client";

// "Ask about my work" (SPEC.md, step 8). Talks only to POST /api/chat.
// Safety rules for this component (security reviews, steps 7 and 8):
// - Everything from the server is rendered as plain text through React. No
//   dangerouslySetInnerHTML, no markdown, no automatic links.
// - Refusals always show the fixed refusal text from CONTENT.md, and errors only
//   the route's known messages, so a compromised server cannot change the wording.
// - Only { question } is sent; no history, no retries; one request at a time,
//   with a timeout. Oversized responses are dropped.
// - Nothing is stored: no localStorage, no analytics.
import { useId, useRef, useState, type FormEvent } from "react";
import { TracePanel, traceFrom, type Trace } from "./trace-panel";

export type ChatPanelText = {
  title: string;
  hint: string;
  logLabel: string;
  startersLabel: string;
  starters: readonly string[];
  inputLabel: string;
  placeholder: string;
  ask: string;
  pending: string;
  sourcesLabel: string;
  refusal: string;
  // The only error messages the route sends (docs/CONTENT.md).
  errors: readonly string[];
  fallbackError: string;
};

type Citation = { id: string; section: string };
type Exchange = { id: number; question: string; trace?: Trace } & (
  | { kind: "answer"; text: string; citations: Citation[] }
  | { kind: "refusal" | "error"; text: string }
);

const MAX_CHARS = 500;
const MAX_SHOWN = 10;
const MAX_ANSWER_CHARS = 2_000;
const MAX_CITATIONS = 10;
const TIMEOUT_MS = 30_000;

function citationsFrom(value: unknown): Citation[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c): c is Citation => !!c && typeof c.id === "string" && typeof c.section === "string" && c.section.length <= 200)
    .slice(0, MAX_CITATIONS);
}

export function ChatPanel({ text }: { text: ChatPanelText }) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [log, setLog] = useState<Exchange[]>([]);
  const inFlight = useRef(false);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const ids = { title: useId(), hint: useId(), input: useId(), count: useId(), starters: useId() };

  async function ask(raw: string) {
    const q = raw.trim();
    // A ref, not state: it blocks a second request immediately, before any re-render.
    if (!q || q.length > MAX_CHARS || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    const id = nextId.current++;
    let entry: Exchange;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const data: unknown = await res.json().catch(() => null);
      const body = (data ?? {}) as { refused?: unknown; answer?: unknown; citations?: unknown; trace?: unknown; error?: unknown };
      if (res.ok && body.refused === true) {
        entry = { id, question: q, kind: "refusal", text: text.refusal, trace: traceFrom(body.trace) ?? undefined };
      } else if (res.ok && typeof body.answer === "string" && body.answer.length > 0 && body.answer.length <= MAX_ANSWER_CHARS) {
        entry = { id, question: q, kind: "answer", text: body.answer, citations: citationsFrom(body.citations), trace: traceFrom(body.trace) ?? undefined };
      } else {
        const known = typeof body.error === "string" && text.errors.includes(body.error);
        entry = { id, question: q, kind: "error", text: known ? (body.error as string) : text.fallbackError };
      }
    } catch {
      entry = { id, question: q, kind: "error", text: text.fallbackError };
    }
    setLog((prev) => [...prev, entry].slice(-MAX_SHOWN));
    setQuestion("");
    setPending(false);
    inFlight.current = false;
    inputRef.current?.focus();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  return (
    <section className="chat" aria-labelledby={ids.title}>
      <div className="chat-head">
        <h2 id={ids.title}>{text.title}</h2>
      </div>
      <p className="chat-hint" id={ids.hint}>
        {text.hint}
      </p>

      <div className="chat-log" role="log" aria-live="polite" aria-busy={pending} aria-label={text.logLabel}>
        {log.map((x) => (
          <div key={x.id} className="exchange">
            <p className="msg msg-user">{x.question}</p>
            <div className={`msg msg-bot${x.kind === "answer" ? "" : " msg-muted"}`}>
              <p className="msg-text">{x.text}</p>
              {x.kind === "answer" && x.citations.length > 0 ? (
                <div className="sources">
                  <p className="msg-label">{text.sourcesLabel}</p>
                  <ul className="citations">
                    {x.citations.map((c) => (
                      <li key={c.id}>{c.section}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {x.trace ? <TracePanel trace={x.trace} /> : null}
            </div>
          </div>
        ))}
        {pending ? <p className="msg msg-bot msg-muted">{text.pending}</p> : null}
      </div>

      <p className="chips-label" id={ids.starters}>
        {text.startersLabel}
      </p>
      <ul className="chips" aria-labelledby={ids.starters}>
        {text.starters.map((s) => (
          <li key={s}>
            <button type="button" className="chip" disabled={pending} onClick={() => void ask(s)}>
              {s}
            </button>
          </li>
        ))}
      </ul>

      <form className="chat-form" onSubmit={onSubmit}>
        <label className="visually-hidden" htmlFor={ids.input}>
          {text.inputLabel}
        </label>
        <input
          ref={inputRef}
          id={ids.input}
          type="text"
          value={question}
          maxLength={MAX_CHARS}
          placeholder={text.placeholder}
          autoComplete="off"
          aria-describedby={`${ids.hint} ${ids.count}`}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="button" type="submit" disabled={pending || question.trim().length === 0}>
          {text.ask}
        </button>
      </form>
      <p className="chat-count" id={ids.count}>
        {question.length} of {MAX_CHARS}
      </p>
    </section>
  );
}
