# ADR 002: Stack

Date: 2026-10-08
Status: accepted (follows docs/SPEC.md)

## Context
The site is mostly static pages plus one chat endpoint that retrieves from a small corpus and calls a language model. It must be cheap to run, easy to review in a public repo, and safe to expose to people who will try to break it.

## Decisions

**Next.js (App Router) with TypeScript, on Vercel.**
Static pages and the chat API route live in one project with one deploy. Server code stays on the server, so keys never reach the browser. Vercel deploys from the main branch on every push. TypeScript catches mistakes early in a small codebase.

**Postgres with pgvector, hosted on Neon.**
One database holds both chunk text and vectors, so retrieval is a single SQL query. Postgres roles give a real read-only user for the chat route, which enforces access in the database, not the prompt. pgvector is also tooling I already use. SPEC.md allows Neon or Supabase. Neon is chosen because only plain Postgres is needed, not Supabase's extra services.

**Upstash Redis for rate limiting.**
It is reached over HTTP, so it works from serverless functions without keeping connections open. It holds only rate limit counters, not user text.

**Provider interfaces: lib/llm.ts and lib/embed.ts.**
Each file exposes a small function signature, and provider SDK types stay inside the file. Swapping a provider means changing one file and one environment variable, not the chat route. The embedding provider is chosen at step 6 and the LLM provider at step 7.

**Vitest for tests, plus a small eval script for the chat.**
Vitest is fast and works with TypeScript without extra setup. The eval script runs the golden, scope and injection sets from SPEC.md.

## Consequences
- Three outside services to sign up for: Vercel, Neon and Upstash, plus the AI providers.
- No auth, accounts or CMS (out of scope in SPEC.md), which keeps the attack surface small.
- Free tiers should cover a personal site. Check each provider's current limits before launch.
