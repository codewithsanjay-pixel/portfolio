// POST /api/mcp: a stateless, read-only MCP server (Streamable HTTP, JSON replies, ADR 013).
// Order matters:
// 1. rate limit, before any other work, with the chat's limiter (fails closed)
// 2. strict input checks: content type, size, JSON
// 3. JSON-RPC handling (lib/mcp/rpc.ts); tools use the chat's retriever and output guards
// A tools/call is one POST, so one limiter check per call is the same embedding budget
// as one chat question. initialize, ping and tools/list are counted too.
// Errors reveal nothing about internals. GET and DELETE are 405: no streams, no sessions.
import { getChatDeps } from "@/lib/chat/handler";
import { handleRpc, rpcError, INVALID_REQUEST, PARSE_ERROR, type RpcOutcome } from "@/lib/mcp/rpc";
import { clientIp, createRateLimiter, type RateLimiter } from "@/lib/ratelimit";

export const maxDuration = 30;

const MAX_BODY_BYTES = 4_096;
const NO_STORE = { "Cache-Control": "no-store" };
const SERVER_ERROR = -32000;

let limiter: RateLimiter | null = null;

function send({ status, reply }: RpcOutcome): Response {
  if (!reply) return new Response(null, { status, headers: NO_STORE });
  return Response.json(reply, { status, headers: NO_STORE });
}

// Reads at most MAX_BODY_BYTES; a larger body is cut off, not buffered.
async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function POST(request: Request): Promise<Response> {
  // 1. Rate limit first. Missing configuration fails closed, like an Upstash outage.
  try {
    // Its own counters (scope "mcp:"), so tool calls cannot use up the chat's daily budget.
    limiter ??= createRateLimiter(process.env, fetch, Date.now, "mcp:");
  } catch {
    return send(rpcError(null, SERVER_ERROR, "The server is not available right now.", 503));
  }
  const limit = await limiter.check(clientIp(request.headers, Boolean(process.env.VERCEL || process.env.VERCEL_ENV)));
  if (!limit.ok) {
    return limit.reason === "unavailable"
      ? send(rpcError(null, SERVER_ERROR, "The server is not available right now.", 503))
      : send(rpcError(null, SERVER_ERROR, "Too many requests. Please try again later.", 429));
  }

  // 2. Input checks. MCP clients are not browsers and send no Origin header. Any request
  // that carries one comes from a web page, and no web page should call this endpoint, so it is refused.
  // (This also closes the DNS-rebinding route.)
  if (request.headers.get("origin")) return send(rpcError(null, INVALID_REQUEST, "Invalid request.", 403));
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return send(rpcError(null, INVALID_REQUEST, "Content-Type must be application/json.", 415));
  }
  const raw = await readBody(request);
  if (raw === null) return send(rpcError(null, INVALID_REQUEST, "Request body is too large.", 413));
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return send(rpcError(null, PARSE_ERROR, "Parse error.", 400));
  }

  // 3. Handle.
  return send(await handleRpc(body, { getDeps: getChatDeps }));
}

const NOT_ALLOWED = { Allow: "POST", ...NO_STORE };

export function GET(): Response {
  return new Response(null, { status: 405, headers: NOT_ALLOWED });
}

export function DELETE(): Response {
  return new Response(null, { status: 405, headers: NOT_ALLOWED });
}
