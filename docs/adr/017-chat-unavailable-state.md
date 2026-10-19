# ADR 017: Chat unavailable state

Date: 2026-10-19
Status: proposed (the owner approves the visitor-facing wording below)

## Context
When `/api/chat` answers 503, or the request never reaches the server, the chat only added one error line to the log. The line scrolled away as more questions were asked, and nothing told the visitor how else to reach the owner. Retrying straight away also spent rate limit for no gain.

## Decision
- On a 503 response or a failed request (network error or timeout), show a status banner above the form: "The assistant is not available right now." and "You can still reach me by email." The second line is a `mailto:` link built from `links.email` in `content/site.ts`.
- The banner is a `role="status"` region, not an alert, because it is not urgent and should not interrupt a screen reader. The region is always in the page and only its content comes and goes, so the change is announced.
- The banner stays until a later request succeeds (an answer or a refusal). A 429 keeps its own message in the log and does not show the banner. Other errors leave the banner as it was.
- After an unavailable failure, Ask and the starter questions are disabled for 5 seconds, and the Ask button reads "Try again in N s". The countdown is one `setInterval`, cleared when it ends or when the component unmounts. The typed question stays in the box so the retry is one click.
- The existing rules are unchanged: one request at a time, a timeout, plain-text rendering, only the route's known messages, nothing stored in the browser.

## Consequences
- The banner wording lives in `components/chat-panel.tsx`. Moving it to `content/site.ts` is a later choice.
- No new dependencies. Styles are classes in `app/globals.css`, with no style attributes, so the CSP from ADR 009 is unchanged.
- The 5 second pause is client-side only. It reduces needless retries but the server limits remain the real control.
