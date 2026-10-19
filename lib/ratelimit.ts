// Rate limits for the chat route (SPEC.md flow step 1): per visitor per minute,
// per visitor per day, and a global daily cap. Upstash Redis over its REST API (/pipeline).
// - Only an HMAC of the visitor's address is stored, never the address itself.
// - The global counter only moves for requests that pass the per-visitor limits,
//   so one visitor cannot use up everyone's daily cap.
// - Fails closed: if Upstash cannot be reached, the request is not allowed.
import { createHmac } from "node:crypto";
import { intEnv, requireEnv, type Env } from "./env";

export type LimitResult = { ok: true } | { ok: false; reason: "minute" | "day" | "global" | "unavailable" };

export type RateLimiter = { check(ip: string): Promise<LimitResult> };

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export function createRateLimiter(env: Env = process.env, fetchImpl: FetchLike = fetch, now: () => number = Date.now, scope = ""): RateLimiter {
  const url = requireEnv("UPSTASH_REDIS_REST_URL", env).replace(/\/+$/, "");
  const token = requireEnv("UPSTASH_REDIS_REST_TOKEN", env);
  // A separate secret is better; the token is the fallback (documented in .env.example).
  const hmacKey = env.RATE_LIMIT_HMAC_SECRET?.trim() || token;
  const perMinute = intEnv("RATE_LIMIT_PER_MINUTE", 5, env);
  const perDay = intEnv("RATE_LIMIT_PER_DAY", 30, env);
  const globalPerDay = intEnv("RATE_LIMIT_GLOBAL_PER_DAY", 300, env);

  // INCR + EXPIRE for each key; returns the counts, or null if Upstash failed.
  async function increment(keys: string[], ttls: number[]): Promise<number[] | null> {
    const commands = keys.flatMap((key, i) => [
      ["INCR", key],
      ["EXPIRE", key, String(ttls[i])],
    ]);
    try {
      const res = await fetchImpl(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(3_000),
      });
      if (!res.ok) return null;
      const items = (await res.json()) as { result?: unknown; error?: string }[];
      if (!Array.isArray(items) || items.length !== commands.length || items.some((x) => x.error)) return null;
      const counts = keys.map((_, i) => Number(items[i * 2].result));
      return counts.some((n) => !Number.isFinite(n)) ? null : counts;
    } catch {
      return null;
    }
  }

  return {
    async check(ip) {
      const id = createHmac("sha256", hmacKey).update(ip).digest("hex").slice(0, 32);
      const t = now();
      const minute = Math.floor(t / 60_000);
      const day = Math.floor(t / 86_400_000);

      // 1. Per visitor. Window-specific keys: each counts one window and then expires.
      const visitor = await increment([`rl:${scope}m:${id}:${minute}`, `rl:${scope}d:${id}:${day}`], [120, 172_800]);
      if (!visitor) return { ok: false, reason: "unavailable" };
      if (visitor[0] > perMinute) return { ok: false, reason: "minute" };
      if (visitor[1] > perDay) return { ok: false, reason: "day" };

      // 2. Global, only for requests that passed the per-visitor limits.
      const global = await increment([`rl:${scope}g:${day}`], [172_800]);
      if (!global) return { ok: false, reason: "unavailable" };
      if (global[0] > globalPerDay) return { ok: false, reason: "global" };
      return { ok: true };
    },
  };
}

// Vercel sets x-real-ip to the client address; the first x-forwarded-for entry is the
// fallback. IPv6 clients usually control a whole /64, so they are bucketed by it.
// Anything missing or malformed shares one strict bucket rather than escaping limits.
export function clientIp(headers: Headers, trustProxyHeaders = true): string {
  // Outside Vercel nothing guarantees these headers, so a caller could rotate them
  // to get a fresh bucket every time. Without trust, everyone shares one strict bucket.
  if (!trustProxyHeaders) return "unknown";
  const candidate = (headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(candidate)) return candidate;
  if (/^[0-9a-f:]{2,45}$/i.test(candidate) && candidate.includes(":")) return ipv6Prefix64(candidate);
  return "unknown";
}

function ipv6Prefix64(address: string): string {
  const [head, tail = ""] = address.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = address.includes("::") ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right] : left;
  return `${groups.slice(0, 4).map((g) => g || "0").join(":")}::/64`;
}
