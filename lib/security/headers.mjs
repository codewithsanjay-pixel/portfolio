// Standard security headers for every response (SPEC.md security checklist).
// The Content-Security-Policy is set per request in proxy.ts (ADR 009).

/** @type {{ key: string, value: string }[]} */
export const SECURITY_HEADERS = [
  // Never let the site be framed (clickjacking). CSP frame-ancestors will repeat this.
  { key: "X-Frame-Options", value: "DENY" },
  // Browsers must not guess content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin to other sites, nothing on downgrade.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site uses no camera, microphone, location, payments or other powerful features.
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), " +
      "magnetometer=(), microphone=(), payment=(), publickey-credentials-get=(), usb=(), browsing-topics=()",
  },
  // HTTPS only, for two years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Isolate the browsing context and keep resources same-origin.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];
