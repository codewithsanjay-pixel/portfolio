# ADR 009: Content-Security-Policy with per-request nonces

Date: 2026-10-09
Status: accepted (I chose option B on 2026-10-09)

## Context
SPEC.md requires a strict Content-Security-Policy, and PROMPTS.md step 9 asks for per-request nonces. The site was built with `cacheComponents` and `partialPrefetching`, so pages were prerendered at build time, and a prerendered page cannot carry a per-request nonce.

I first chose to allow only the inline theme script by its hash. The built home page turned out to have 19 inline scripts: the theme script, Turbopack's loader, and 17 Next.js page-data scripts that change with every page and every build. A theme-only hash would have blocked them and broken the interactive parts. `'unsafe-inline'` for scripts is ruled out.

## Decision
- Per-request nonces, as Next.js documents for a strict CSP:
  - `proxy.ts` makes a fresh 16-byte nonce for every page request.
  - It puts the nonce in the request's CSP header, so Next.js attaches it to all of its own scripts and styles.
  - It also puts the nonce in `x-nonce`, so the root layout can attach it to the theme script.
  - It sends the same policy on the response.
- The policy (`lib/security/csp.mjs`):
  - `default-src 'self'`
  - `script-src 'self' 'nonce-…' 'strict-dynamic'` (plus `'unsafe-eval'` in development only)
  - `style-src 'self' 'nonce-…'`
  - `img-src 'self'`, `font-src 'self'`, `connect-src 'self'`, `manifest-src 'self'`
  - `frame-src 'none'`, `worker-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`
  - `upgrade-insecure-requests`, on Vercel only. On `http://127.0.0.1` it would break local testing.
- The proxy runs on everything except built static files and the favicon. That includes `/api/*`, whose 404s render as HTML, and prefetch requests. So no HTML is ever served without a policy, and a client-sent `x-nonce` is always overwritten (security review, step 9).
- Every page renders per request: `cacheComponents` and `partialPrefetching` are off, and the root layout reads the request headers.
- **No violation reporting (`report-to`):** a report endpoint would be another public POST route needing its own rate limit. `npm run check:csp` catches violations before deploy instead. Revisit if the site grows.
- **HSTS:** two years with `includeSubDomains`, without `preload`. A `vercel.app` subdomain cannot be preloaded, and preloading is hard to undo. Check `includeSubDomains` before adding a custom domain.
- **Not added:** Cross-Origin-Embedder-Policy (nothing needs it, and it breaks embeds).
- Next.js's built-in 404 page uses inline style attributes, which the policy blocks, so the site has its own 404 page (`app/not-found.tsx`).
- The other security headers stay static (`lib/security/headers.mjs`): frame, content-type, referrer, permissions, HSTS, COOP and CORP.

## How it is checked
- `npm run check:csp` runs in `npm run verify`, after the build. It starts the built site and fetches every page from the build manifest twice, plus a 404 page and an `/api` 404. It fails if:
  - the policy is missing or allows `'unsafe-inline'` for scripts
  - any `<script>`, `<style>` or script preload lacks the request's nonce
  - the nonce does not change between requests
  - any page has an inline event handler, a `style` attribute or a `javascript:` URL
  - any security header is missing, `X-Powered-By` is sent, or HTML is cacheable (it must be `no-store`, or a cached page would reuse a nonce)
  - a prefetch request with a forged `x-nonce` gets no policy, or its forged nonce is used
- Unit tests cover the policy, the nonce and the proxy (`tests/csp.test.ts`).
- On 2026-10-09 the built home page was also loaded in headless Edge, and React hydrated under the policy: the theme button changed from its pre-load label to "Light theme".

## Amends
- **SPEC.md:** the security checklist's "Strict Content-Security-Policy" is met with per-request nonces, and pages render per request instead of being prerendered.
- **ADR 002:** Next.js is still the framework, but without static prerendering of pages.

## Consequences
- Each page view runs server rendering: slightly slower first loads and more server work. That is small for a site this size, and it can be revisited if Next.js gains nonce support for prerendered pages.
- New code must not use inline `style` attributes or inline event handlers; `npm run check:csp` fails if it does.
- Any third-party script would need the nonce; there are none.
