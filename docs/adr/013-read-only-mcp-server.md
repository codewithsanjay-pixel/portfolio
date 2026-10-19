# ADR 013: Read-only MCP server

Date: 2026-10-19
Status: accepted (I approved all backend and frontend changes on 2026-10-19; no facts or wording about me change)

## Context
The site is for a backend AI engineer who works with agents and MCP. A visitor's own AI client should be able to read my public resume text the same way the chat assistant does, without a second copy of the rules.

## Decision
- `POST /api/mcp` is a stateless Model Context Protocol server over HTTP (Streamable HTTP, JSON replies, protocol version 2025-06-18; 2025-03-26 and 2024-11-05 are echoed if a client asks for them).
- JSON-RPC 2.0 is handled by hand in `lib/mcp/rpc.ts`: `initialize`, `notifications/initialized` (202, no body), `ping`, `tools/list`, `tools/call`. Errors are -32700, -32600, -32601 and -32602. Batches are rejected with -32600. No new dependencies.
- GET and DELETE return 405. There are no sessions, no event streams, no resumability.
- Three tools, defined once in `lib/mcp/tools.ts` and rendered on `/mcp` from the same objects:
  - `search_resume { query }`: top passages as `{ section, text, score }`, score to one decimal.
  - `get_section { section }`: the text of one section, from an enum of public section labels.
  - `list_evals {}`: names, descriptions and case counts of the public eval sets, taken from the table on the how-it's-built page. Private sets are never listed.
- Everything is read-only:
  - No tool has a write path.
  - Search uses the chat's `retrieve()` with the read-only database role and the current-corpus allow-list, through the shared `getChatDeps()` in `lib/chat/handler.ts`.
  - No chunk ids appear in any output.
  - Every returned text passes the chat's output guards (`unsafeAnswer`, `containsPrivateTerm` with `PRIVATE_TERMS`). A failing passage is dropped without a reason, so the tools cannot be used to probe the guards.
  - Passages below the chat's scope score (`SCOPE_MIN_SCORE`) are dropped.
- Rate limiting uses the chat's limiter, before any other work, and fails closed. Every POST is counted, including `initialize` and `tools/list`. Batches are refused, so one `tools/call` is one limiter check, which is one embedding call: the same spend as one chat question, and the MCP and chat share the visitor's quota. A separate cap was not added because the shared limiter already bounds it.
- Input: `application/json` only, body at most 4 KB (read with a cap, not buffered), tool arguments checked against the schema by hand (unknown keys refused), unknown tool is -32602. A request with a mismatched `Origin` header is refused with 403.
- Failures inside a tool (database, embedding, configuration) return one generic tool error. Nothing about internals is returned.

## Consequences
- `next.config.ts` must ship `docs/RESUME.md` with this route too: `outputFileTracingIncludes` needs a `"/api/mcp"` entry next to `"/api/chat"`.
- The `/mcp` page needs a navigation link. It reads the request host header to show the endpoint, so it renders per request, like every page (ADR 009).
- Clients sharing the chat quota can use it up. That is accepted: the quota is small on purpose.
- The server returns passages, not model answers, so it adds no model spend.
