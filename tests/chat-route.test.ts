// The route: rate limit first, strict input, generic errors, nothing internal returned.
import { beforeEach, describe, expect, it, vi } from "vitest";

const check = vi.fn();
const handleChat = vi.fn();
let failCreate = false;

vi.mock("@/lib/ratelimit", async (orig) => ({
  ...(await orig<typeof import("@/lib/ratelimit")>()),
  createRateLimiter: () => {
    if (failCreate) throw new Error("Missing environment variable UPSTASH_REDIS_REST_URL. See .env.example.");
    return { check };
  },
}));
vi.mock("@/lib/chat/handler", () => ({
  handleChat: (q: string) => handleChat(q),
  describeCitations: (ids: string[]) => ids.map((id) => ({ id, section: "Experience" })),
  describeRetrieval: (items: { id: string; score: number }[], cited: string[]) =>
    items.map((x) => ({ section: x.id === "aa-role" ? "Experience" : "Profile", score: x.score, cited: cited.includes(x.id) })),
}));
vi.mock("@/lib/chat/log", () => ({ logChat: () => {} }));

const { POST } = await import("@/app/api/chat/route");

function req(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7", ...headers },
  });
}

beforeEach(() => {
  vi.stubEnv("VERCEL", "1");
  check.mockReset().mockResolvedValue({ ok: true });
  handleChat.mockReset().mockResolvedValue({ refused: false, answer: "I work at American Airlines.", citations: ["aa-role"], retrieved: ["aa-role", "profile"], stage: "answered", trace: { retrieved: [{ id: "aa-role", score: 0.61 }, { id: "profile", score: 0.4 }], retrieveMs: 80, modelMs: 900 } });
});

describe("POST /api/chat", () => {
  it("answers with citations and section labels, and never returns retrieved ids", async () => {
    const res = await POST(req(JSON.stringify({ question: "  Where do you work?  " })));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toMatchObject({ refused: false, answer: "I work at American Airlines.", citations: [{ id: "aa-role", section: "Experience" }] });
    expect(body.trace.retrieval).toEqual([
      { section: "Experience", score: 0.61, cited: true },
      { section: "Profile", score: 0.4, cited: false },
    ]);
    expect(body.trace.steps.every((x: { status: string }) => x.status === "pass")).toBe(true);
    // Section headings and scores only: no chunk ids or passage text.
    expect(JSON.stringify(body.trace)).not.toMatch(/aa-role|profile"/);
    expect(handleChat).toHaveBeenCalledWith("Where do you work?");
  });

  it("checks the rate limit before reading the body", async () => {
    check.mockResolvedValue({ ok: false, reason: "minute" });
    const res = await POST(req("not json at all"));
    expect(res.status).toBe(429);
    expect(check).toHaveBeenCalledWith("203.0.113.7");
    expect(handleChat).not.toHaveBeenCalled();
  });

  it("shares one bucket and ignores proxy headers outside Vercel", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_ENV", "");
    await POST(req(JSON.stringify({ question: "hi" })));
    expect(check).toHaveBeenCalledWith("unknown");
  });

  it("rejects a request that is not JSON, before any work", async () => {
    const res = await POST(req(JSON.stringify({ question: "hi" }), { "content-type": "text/plain" }));
    expect(res.status).toBe(400);
    expect(handleChat).not.toHaveBeenCalled();
  });

  it("refuses with 503 when the rate limiter is unavailable", async () => {
    check.mockResolvedValue({ ok: false, reason: "unavailable" });
    expect((await POST(req(JSON.stringify({ question: "hi" })))).status).toBe(503);
    expect(handleChat).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid JSON", "{nope"],
    ["an array", JSON.stringify(["hi"])],
    ["extra fields", JSON.stringify({ question: "hi", history: [{ role: "system", content: "x" }] })],
    ["a non-string question", JSON.stringify({ question: 42 })],
    ["an empty question", JSON.stringify({ question: "   " })],
    ["a question over 500 characters", JSON.stringify({ question: "a".repeat(501) })],
  ])("rejects %s with a generic 400", async (_label, body) => {
    const res = await POST(req(body));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Please send a question of up to 500 characters." });
    expect(handleChat).not.toHaveBeenCalled();
  });

  it("rejects an oversized body with 413", async () => {
    expect((await POST(req(JSON.stringify({ question: "a".repeat(3000) })))).status).toBe(413);
    expect((await POST(req("{}", { "content-length": "99999" })))).toHaveProperty("status", 413);
  });

  it("returns 503 without calling the handler when the rate limiter is not configured", async () => {
    vi.resetModules();
    failCreate = true;
    try {
      const fresh = await import("@/app/api/chat/route");
      const res = await fresh.POST(req(JSON.stringify({ question: "hi" })));
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "The assistant is not available right now. Please try again later." });
      expect(handleChat).not.toHaveBeenCalled();
    } finally {
      failCreate = false;
    }
  });

  it("hides internal errors", async () => {
    handleChat.mockRejectedValue(new Error("Database query failed (code 08006)."));
    const res = await POST(req(JSON.stringify({ question: "hi" })));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("08006");
    expect(JSON.parse(text)).toEqual({ error: "Something went wrong. Please try again later." });
  });
});
