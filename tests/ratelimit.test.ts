import { describe, expect, it, vi } from "vitest";
import { clientIp, createRateLimiter } from "@/lib/ratelimit";

const ENV = {
  UPSTASH_REDIS_REST_URL: "https://redis.example.upstash.io/",
  UPSTASH_REDIS_REST_TOKEN: "token-secret",
  RATE_LIMIT_PER_MINUTE: "2",
  RATE_LIMIT_PER_DAY: "3",
  RATE_LIMIT_GLOBAL_PER_DAY: "4",
};

type Call = [string, RequestInit];

// Fake Upstash: answers each pipeline call with the given counts (INCR results).
function upstash(visitor: [number, number], global = 1) {
  return vi.fn(async (_url: string, init: RequestInit) => {
    const commands = JSON.parse(String(init.body)) as string[][];
    const incrs = commands.filter((c) => c[0] === "INCR").map((c) => c[1]);
    const counts = incrs.map((key) => (key.startsWith("rl:m:") ? visitor[0] : key.startsWith("rl:d:") ? visitor[1] : global));
    return Response.json(counts.flatMap((n) => [{ result: n }, { result: 1 }]));
  });
}

function keysSent(fetchImpl: ReturnType<typeof upstash>): string[] {
  return fetchImpl.mock.calls.flatMap((call) => (JSON.parse(String((call as unknown as Call)[1].body)) as string[][]).filter((c) => c[0] === "INCR").map((c) => c[1]));
}

describe("createRateLimiter", () => {
  it("allows a request under every limit, with hashed keys and never the raw IP", async () => {
    const fetchImpl = upstash([1, 1]);
    expect(await createRateLimiter(ENV, fetchImpl, () => 0).check("203.0.113.7")).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as Call;
    expect(url).toBe("https://redis.example.upstash.io/pipeline");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-secret");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    for (const call of fetchImpl.mock.calls) expect(String((call as unknown as Call)[1].body)).not.toContain("203.0.113.7");
    expect(keysSent(fetchImpl).some((k) => k.startsWith("rl:g:"))).toBe(true);
  });

  it.each([
    [[3, 1], "minute"],
    [[1, 4], "day"],
  ] as const)("blocks per visitor (%j: %s) without touching the global counter", async (counts, reason) => {
    const fetchImpl = upstash([...counts]);
    expect(await createRateLimiter(ENV, fetchImpl, () => 0).check("1.1.1.1")).toEqual({ ok: false, reason });
    expect(keysSent(fetchImpl).some((k) => k.startsWith("rl:g:"))).toBe(false);
  });

  it("blocks when the global daily cap is reached", async () => {
    expect(await createRateLimiter(ENV, upstash([1, 1], 5), () => 0).check("1.1.1.1")).toEqual({ ok: false, reason: "global" });
  });

  it.each([
    ["a network error", vi.fn(async () => { throw new Error("down"); })],
    ["a 500", vi.fn(async () => new Response("no", { status: 500 }))],
    ["an error item", vi.fn(async () => Response.json([{ error: "ERR" }, {}, {}, {}]))],
    ["a short reply", vi.fn(async () => Response.json([{ result: 1 }]))],
  ])("fails closed on %s", async (_label, fetchImpl) => {
    expect(await createRateLimiter(ENV, fetchImpl, () => 0).check("1.1.1.1")).toEqual({ ok: false, reason: "unavailable" });
  });

  it("hashes with RATE_LIMIT_HMAC_SECRET when set", async () => {
    const a = upstash([1, 1]);
    const b = upstash([1, 1]);
    await createRateLimiter(ENV, a, () => 0).check("1.1.1.1");
    await createRateLimiter({ ...ENV, RATE_LIMIT_HMAC_SECRET: "other-secret" }, b, () => 0).check("1.1.1.1");
    expect(keysSent(a)[0]).not.toBe(keysSent(b)[0]);
  });
});

describe("clientIp", () => {
  it("prefers x-real-ip, falls back to the first forwarded address", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2", "x-forwarded-for": "203.0.113.7" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("buckets IPv6 by /64", () => {
    expect(clientIp(new Headers({ "x-real-ip": "2001:db8:1:2:aaaa::1" }))).toBe("2001:db8:1:2::/64");
    expect(clientIp(new Headers({ "x-real-ip": "2001:db8:1:2:bbbb::9" }))).toBe("2001:db8:1:2::/64");
    expect(clientIp(new Headers({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8:0:0::/64");
  });

  it("puts anything odd in one strict bucket", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "<script>" }))).toBe("unknown");
    expect(clientIp(new Headers())).toBe("unknown");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }), false)).toBe("unknown");
  });
});
