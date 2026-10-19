// POST /api/chat (SPEC.md chat flow). Order matters:
// 1. rate limit, before any other work
// 2. strict input checks: JSON, only { question }, 1 to 500 characters
// 3. input check, retrieval, scope check, answer, citation check and output guard
//    (lib/chat/answer.ts, ADR 008)
// Errors reveal nothing about internals.
// With "Accept: text/event-stream" the answer step streams typed events instead
// (lib/chat/stream.ts, docs/CHAT-EVENTS.md). Steps 1 and 2 run first either way, so
// every rejection is still the normal JSON error and no stream starts for it.
import { describeCitations, describeRetrieval, handleChat } from "@/lib/chat/handler";
import { encodeEvent } from "@/lib/chat/stream";
import { buildTrace } from "@/lib/chat/trace";
import type { ChatResult } from "@/lib/chat/types";
import { logChat } from "@/lib/chat/log";
import { clientIp, createRateLimiter, type RateLimiter } from "@/lib/ratelimit";

export const maxDuration = 30;

const MAX_QUESTION_CHARS = 500;
const MAX_BODY_BYTES = 2_048;

// handleChat also takes the step callback (lib/chat/handler.ts passes it to answerQuestion).

const NO_STORE = { "Cache-Control": "no-store" };
const MESSAGES = {
  invalid: `Please send a question of up to ${MAX_QUESTION_CHARS} characters.`,
  limited: "Too many questions. Please try again later.",
  unavailable: "The assistant is not available right now. Please try again later.",
  error: "Something went wrong. Please try again later.",
};

let limiter: RateLimiter | null = null;

function error(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: NO_STORE });
}

function parseQuestion(raw: string): string | null {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "question") return null;
  const q = (body as { question: unknown }).question;
  if (typeof q !== "string") return null;
  const question = q.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  if (question.length === 0 || question.length > MAX_QUESTION_CHARS) return null;
  return question;
}

export async function POST(request: Request): Promise<Response> {
  const started = Date.now();

  // 1. Rate limit first. Missing configuration fails closed, like an Upstash outage.
  try {
    limiter ??= createRateLimiter();
  } catch {
    logChat({ event: "error", reason: "rate limiter not configured" });
    return error(503, MESSAGES.unavailable);
  }
  const limit = await limiter.check(clientIp(request.headers, Boolean(process.env.VERCEL || process.env.VERCEL_ENV)));
  if (!limit.ok) {
    logChat({ event: "rate_limited", reason: limit.reason });
    return limit.reason === "unavailable" ? error(503, MESSAGES.unavailable) : error(429, MESSAGES.limited);
  }

  // 2. Input checks. JSON only: a cross-site form or text/plain fetch cannot spend a visitor's quota.
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    logChat({ event: "invalid_input" });
    return error(400, MESSAGES.invalid);
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return error(413, MESSAGES.invalid);
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return error(413, MESSAGES.invalid);
  const question = parseQuestion(raw);
  if (!question) {
    logChat({ event: "invalid_input" });
    return error(400, MESSAGES.invalid);
  }

  // 3. Answer.
  if ((request.headers.get("accept") ?? "").toLowerCase().includes("text/event-stream")) return stream(question, started);
  try {
    const result = await handleChat(question);
    return Response.json(finalBody(result, question, started), { headers: NO_STORE });
  } catch (err) {
    return failed(err, 500);
  }
}

function finalBody(result: ChatResult, question: string, started: number) {
  logChat({ event: result.refused ? "refused" : "answered", ms: Date.now() - started, citations: result.citations.length }, question);
  return {
    refused: result.refused,
    answer: result.answer,
    citations: describeCitations(result.citations),
    trace: buildTrace(result, describeRetrieval, Date.now() - started),
  };
}

function failed(err: unknown, status: number): Response {
  // Our own error messages never contain secrets or user text (lib/db.ts, lib/embed.ts, lib/llm.ts).
  logChat({ event: "error", reason: err instanceof Error ? err.message : "unknown" });
  return error(status, MESSAGES.error);
}

// Server-sent events: one "stage" per passed step, then exactly one "final" or "error".
function stream(question: string, started: number): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (type: "stage" | "final" | "error", data: Record<string, unknown>) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(type, data)));
        } catch {
          open = false;
        }
      };
      // The rate limit step passed before the stream started.
      send("stage", { key: "rate" });
      try {
        const result = await handleChat(question, (key, ms) => send("stage", { key, ...(ms === undefined ? {} : { ms: Math.max(50, Math.round(ms / 50) * 50) }) }));
        send("final", finalBody(result, question, started));
      } catch (err) {
        logChat({ event: "error", reason: err instanceof Error ? err.message : "unknown" });
        send("error", { message: MESSAGES.error });
      }
      if (open) {
        open = false;
        controller.close();
      }
    },
    cancel() {
      // The visitor left; later sends are no-ops because enqueue throws and is caught.
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
