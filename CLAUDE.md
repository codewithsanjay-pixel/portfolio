# Portfolio project: rules for Claude Code

## What this is
A personal portfolio site for a backend AI engineer (RAG, agents, MCP). It shows real work to engineers and hiring managers, and includes a small chat assistant that answers questions about my resume and projects.

## Source of truth
- docs/RESUME.md is the only source of facts about me.
- docs/CONTENT.md is draft copy. Anything marked [CONFIRM] must be confirmed by me before it goes on the site.
- docs/SPEC.md is the locked build spec. Follow it. If you think it should change, stop, propose the change, and record the decision in docs/adr/ after I approve.
- docs/REFERENCE-NOTES.md describes another engineer's site, for structure ideas only.

## Hard rules
1. Never invent facts. No made-up metrics, dates, employers, titles, projects or quotes. If a fact is not in docs/RESUME.md, leave a [CONFIRM] marker and ask me.
2. Never copy text, images, branding, layout details or prompts from any other site. Everything must be original.
3. Never include confidential employer details. Describe employer work in general terms (type of problem, my role, technologies). No internal system names, data or numbers that I have not approved.
4. Secrets (API keys, database URLs) live only in server-side environment variables. Never in client code, never committed. Keep a .env.example with names only.
5. The chat assistant answers only from retrieved resume and project text, cites its sources, and refuses everything else.
6. Run `npm run verify` (lint, typecheck, tests, build) before every commit. Do not commit if it fails.
7. Keep commits small with clear messages.
8. If something is unclear, ask me. Do not guess.

## Working style
- Plan first for any new feature: a short plan, then implement.
- Keep it simple. Prefer fewer dependencies.
- Before finishing each phase, run the subagents in .claude/agents: consistency-auditor and security-reviewer. Fix what they find.
- Write plain, human copy. No buzzwords, no hype, no em dashes.

## Stack (details in docs/SPEC.md)
Next.js (App Router) with TypeScript, hosted on Vercel. Postgres with pgvector for retrieval. Upstash Redis for rate limiting. One LLM provider and one embedding provider, each behind a small interface so they can be swapped.
