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
// - The request asks for server-sent events (docs/CHAT-EVENTS.md). Every event is
//   validated (known type and step key, version 1, size caps) and unknown ones are
//   ignored. Stage events only light up the live step list; the answer always comes
//   from the single "final" event, through the same checks as a JSON response. A
//   JSON response (errors, or a server without streaming) is handled as before.
import { useId, useRef, useState, type FormEvent } from "react";
import { createSseReader, parseChatEvent } from "@/lib/chat/stream";
import { LiveTrace, TracePanel, TRACE_STEPS, traceFrom, type Trace, type TraceKey } from "./trace-panel";

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

type RawBody = { refused?: unknown; answer?: unknown; citations?: unknown; trace?: unknown; error?: unknown };
type Passed = { key: TraceKey; ms?: number }[];

// Reads the event stream to its one terminal event. A stream that ends without
// "final" or "error", a stream that is too large, or a read failure all show the
// fallback message. Events after the terminal one are never read.
async function readStream(
  body: ReadableStream<Uint8Array>,
  entryFrom: (ok: boolean, body: RawBody) => Exchange,
  failed: (message?: unknown) => Exchange,
  onPassed: (passed: Passed) => void,
): Promise<Exchange> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const sse = createSseReader();
  const passed: Passed = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return failed();
      for (const raw of sse.feed(decoder.decode(value, { stream: true }))) {
        const ev = parseChatEvent(raw.event, raw.data);
        if (!ev) continue;
        if (ev.type === "final") return entryFrom(true, ev.body as RawBody);
        if (ev.type === "error") return failed(ev.message);
        // Each step once, in order: anything else is ignored.
        const last = passed.length ? TRACE_STEPS.indexOf(passed[passed.length - 1].key) : -1;
        if (TRACE_STEPS.indexOf(ev.key) <= last) continue;
        passed.push({ key: ev.key, ...(ev.ms === undefined ? {} : { ms: ev.ms }) });
        onPassed([...passed]);
      }
    }
  } catch {
    return failed();
  } finally {
    void reader.cancel().catch(() => {});
  }
}

export function ChatPanel({ text }: { text: ChatPanelText }) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [log, setLog] = useState<Exchange[]>([]);
  const [live, setLive] = useState<Passed | null>(null);
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
    // One place turns a response body into what is shown, for JSON and for the final event.
    const entryFrom = (ok: boolean, body: RawBody): Exchange => {
      if (ok && body.refused === true) {
        return { id, question: q, kind: "refusal", text: text.refusal, trace: traceFrom(body.trace) ?? undefined };
      }
      if (ok && typeof body.answer === "string" && body.answer.length > 0 && body.answer.length <= MAX_ANSWER_CHARS) {
        return { id, question: q, kind: "answer", text: body.answer, citations: citationsFrom(body.citations), trace: traceFrom(body.trace) ?? undefined };
      }
      const known = typeof body.error === "string" && text.errors.includes(body.error);
      return { id, question: q, kind: "error", text: known ? (body.error as string) : text.fallbackError };
    };
    const failed = (message?: unknown): Exchange => entryFrom(false, { error: message });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream, application/json;q=0.9" },
        body: JSON.stringify({ question: q }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok && res.body && (res.headers.get("content-type") ?? "").toLowerCase().startsWith("text/event-stream")) {
        entry = await readStream(res.body, entryFrom, failed, (passed) => setLive(passed));
      } else {
        const data: unknown = await res.json().catch(() => null);
        entry = entryFrom(res.ok, (data ?? {}) as RawBody);
      }
    } catch {
      entry = failed();
    }
    setLog((prev) => [...prev, entry].slice(-MAX_SHOWN));
    setLive(null);
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
        {pending ? (
          <div className="msg msg-bot msg-muted">
            <p>{text.pending}</p>
            {live ? <LiveTrace passed={live} /> : null}
          </div>
        ) : null}
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
