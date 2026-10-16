import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { SECURITY_HEADERS } from "./lib/security/headers.mjs";
import { checkExample } from "./scripts/example-guard.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // No cacheComponents or partialPrefetching: per-request CSP nonces need every
  // page rendered per request (ADR 009).
  // The chat route builds its allowed chunk list from the resume at runtime.
  outputFileTracingIncludes: { "/api/chat": ["./docs/RESUME.md"] },
  // Do not advertise the framework.
  poweredByHeader: false,
  async headers() {
    // The Content-Security-Policy is set per request in proxy.ts (ADR 009).
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default function config(phase: string): NextConfig {
  // Second copy of the example guard (ADR 005), so `next build` started any
  // way at all still refuses to ship the fictional example.
  if (phase === PHASE_PRODUCTION_BUILD) {
    const result = checkExample(ROOT);
    if (!result.ok) throw new Error(result.message);
  }
  return nextConfig;
}
