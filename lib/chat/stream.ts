// Typed server-sent events for POST /api/chat (ADR 012, docs/CHAT-EVENTS.md).
// Pure functions with no server or browser dependencies: the route uses the
// encoder, the chat panel uses the parser and the validator.
import { STEP_ORDER, type StepKey } from "./trace";

export const EVENT_VERSION = 1;
// A single event or the whole stream larger than this is dropped by the client.
export const MAX_EVENT_BYTES = 16_384;
export const MAX_STREAM_BYTES = 65_536;

export type ChatEvent =
  | { type: "stage"; key: StepKey; ms?: number }
  | { type: "final"; body: unknown }
  | { type: "error"; message: string };

// ----------------------------------------------------------------- server

export function encodeEvent(type: "stage" | "final" | "error", data: Record<string, unknown>): string {
  return `event: ${type}\ndata: ${JSON.stringify({ v: EVENT_VERSION, ...data })}\n\n`;
}

// ----------------------------------------------------------------- client

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// Returns null for anything that is not a known, well-formed v1 event.
export function parseChatEvent(name: string, data: string): ChatEvent | null {
  if (data.length > MAX_EVENT_BYTES) return null;
  let body: unknown;
  try {
    body = JSON.parse(data);
  } catch {
    return null;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (b.v !== EVENT_VERSION) return null;
  if (name === "stage") {
    if (typeof b.key !== "string" || !(STEP_ORDER as readonly string[]).includes(b.key)) return null;
    return { type: "stage", key: b.key as StepKey, ...(isNum(b.ms) ? { ms: Math.min(600_000, Math.max(0, Math.round(b.ms))) } : {}) };
  }
  if (name === "final") {
    const { v: _v, ...rest } = b;
    void _v;
    return { type: "final", body: rest };
  }
  if (name === "error") return typeof b.message === "string" && b.message.length <= 500 ? { type: "error", message: b.message } : null;
  return null;
}

// Incremental SSE reader. Feed it decoded text in any chunking; it returns the
// complete { event, data } blocks found so far. Throws if the stream is too large.
export function createSseReader() {
  let buffer = "";
  let total = 0;
  return {
    feed(chunk: string): { event: string; data: string }[] {
      total += chunk.length;
      if (total > MAX_STREAM_BYTES) throw new Error("stream too large");
      buffer += chunk;
      // Hold a trailing \r: it may be the first half of \r\n.
      const held = buffer.endsWith("\r") ? "\r" : "";
      buffer = buffer.slice(0, buffer.length - held.length).replace(/\r\n?/g, "\n") + held;
      const out: { event: string; data: string }[] = [];
      let i: number;
      while ((i = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, i);
        buffer = buffer.slice(i + 2);
        let event = "message";
        const data: string[] = [];
        for (const line of block.split("\n")) {
          if (line.startsWith(":")) continue;
          const c = line.indexOf(":");
          const field = c === -1 ? line : line.slice(0, c);
          const value = c === -1 ? "" : line.slice(c + 1).replace(/^ /, "");
          if (field === "event") event = value;
          else if (field === "data") data.push(value);
        }
        if (data.length > 0) out.push({ event, data: data.join("\n") });
      }
      if (buffer.length > MAX_EVENT_BYTES) throw new Error("event too large");
      return out;
    },
  };
}
