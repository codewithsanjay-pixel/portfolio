# ADR 014: Trust page, "Try to break it" panel and hero facts strip

Date: 2026-10-19
Status: accepted (the owner approved the frontend changes and the wording that describes this site's engineering; no wording about the owner's work history changes)

## Context
The site claims that the chat is read-only, stateless and limited to the resume. A visitor had to read several files to check that. The strongest evidence is already in the repository: the controls in code, and the injection evals. ADR 011 added a public request trace, which makes a live attempt easy to inspect.

## Decision
- Add `/trust` ("Trust and limits"): what the assistant is, a table of seven controls with GitHub links to the files that enforce them, what it does not do, and what the evals cover. Eval counts are computed from the `howItsBuilt` table in `content/site.ts`, never typed. `tests/trust-page.test.tsx` checks that every linked file exists and is tracked by git.
- Add a "Try to break it" panel (`components/break-it.tsx`). It lists the questions of the public injection set, `evals/injection.json`, and nothing else. Private eval sets are never read. The server page reads the file at request time and drops any question that matches the site's never-print list (`lib/safety/forbidden.mjs`) before the list reaches the browser, so that wording is neither in the page nor bundled (the post-build scan would fail on it). The page says how many questions are left out.
- A click sends one question to `POST /api/chat` with the same rules as the chat panel: only `{ question }`, a timeout, a validated response shape, plain-text rendering, one request at a time, nothing stored. It shows the expected outcome from the eval, the actual outcome, and the trace with the existing `TracePanel`. The page states that these requests share the visitor's per-minute and per-day limits and the site-wide daily limit.
- Add three tiles to the hero. Their values are derived: eval case total and passed count from the `howItsBuilt` table, runtime dependency count from `package.json`, and the text "Strict CSP, nonce per request", which `tests/trust-page.test.tsx` checks against `proxy.ts` and `lib/security/csp.mjs`. Each tile links to where it can be checked.
- Add a "Source" link on each pipeline stage, to the file on GitHub that implements it. A test checks the paths exist and are tracked.
- Add "Trust" and "MCP" to the header and the command palette. The MCP page is built by a separate change; only the link is added here.
- Update SPEC.md (home section order including `pipeline`, the two pages, the trace field, the palette) and CONTENT.md. In `howItsBuilt`, the first section now lists the trust page, and the chat section gains one sentence about the request trace. The existing "one fixed refusal message and no sources" sentence stays: it is still true, because a refusal carries no citations and no retrieval rows.

## Amends
- **SPEC.md, interactions:** "no headline counters" now has one exception, the three hero tiles. Each value is computed from the repository and links to its source.

## Consequences
- The trust page reads `evals/injection.json` from disk per request. The deploy must include that file for `/trust` (for example with `outputFileTracingIncludes`, as for the resume and `/api/chat`).
- If the injection set changes, the panel changes with it. A case is hidden only if it matches the never-print list.
- Clicking questions spends the visitor's rate limit. That is stated on the page.
- New styles live in `app/pages.css` and use no style attributes, so the CSP from ADR 009 is unchanged. Zero new runtime dependencies.
