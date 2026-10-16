// Per-request Content-Security-Policy nonce (ADR 009). Next.js reads the nonce
// from the request's CSP header and attaches it to its own scripts; the root
// layout reads x-nonce for the theme script. Any x-nonce a client sends is
// overwritten here, and the proxy runs on every page, prefetches and /api 404s
// included, so no HTML is ever served without a policy.
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, makeNonce } from "./lib/security/csp.mjs";

export function proxy(request: NextRequest) {
  const nonce = makeNonce();
  const csp = buildCsp(nonce, {
    dev: process.env.NODE_ENV === "development",
    upgrade: Boolean(process.env.VERCEL_ENV),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Everything except built static files and the favicon, which carry no HTML.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
