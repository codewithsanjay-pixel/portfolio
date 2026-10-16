// Content-Security-Policy (ADR 009). Per-request nonces: proxy.ts makes a fresh
// nonce for every page request; Next.js puts it on all of its own scripts, and
// the root layout puts it on the theme script. No 'unsafe-inline' for scripts.

/**
 * @param {string} nonce
 * @param {{ dev?: boolean, upgrade?: boolean }} [options]
 */
export function buildCsp(nonce, { dev = false, upgrade = false } = {}) {
  if (!/^[A-Za-z0-9+/=]{16,}$/.test(nonce)) throw new Error("Invalid CSP nonce.");
  const directives = [
    "default-src 'self'",
    // 'strict-dynamic': scripts loaded by a nonce'd script are trusted; nothing else is.
    // React needs 'unsafe-eval' only in development, for its debugging tools.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self'",
    "font-src 'self'",
    // The chat panel only talks to this site's own /api/chat.
    "connect-src 'self'",
    "frame-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
  ];
  // Only on HTTPS deployments; on http://127.0.0.1 it would break local testing.
  if (upgrade) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

// 16 random bytes, base64. Works in the proxy runtime and in Node.
export function makeNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
