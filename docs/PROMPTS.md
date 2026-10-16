# Prompts for Claude Code (paste in order)

How to use: start Claude Code in the project folder with `claude --permission-mode plan`. Paste one prompt at a time. Read the plan it gives you. Approve it only when it makes sense. After each step run `npm run verify`, then commit.

Rules that apply to every prompt: follow CLAUDE.md, use only facts from docs/RESUME.md, ask me when something is unclear, never guess.

---

## Prompt 0: Orientation (no code yet)
Read CLAUDE.md, docs/SPEC.md, docs/RESUME.md, docs/CONTENT.md and docs/REFERENCE-NOTES.md. Then tell me in plain words: what we are building, what the open [CONFIRM] items are, and what you need from me before step 1. Do not write code.

## Prompt 1: Wireframe first
Build one static HTML prototype of the whole site (home, focus, projects, about, contact, how it's built, chat panel) in a /prototype folder. No framework. Original design, light and dark theme with CSS variables, readable on a phone. Use placeholder text only where CONTENT.md has [CONFIRM]. Show me how to open it.

## Prompt 2: Design brief and decisions
Write docs/DESIGN-BRIEF.md (colors, type, spacing, tone) and docs/adr/001-stack.md (why Next.js, Postgres with pgvector, Upstash, provider interfaces). Keep each under one page, plain words.

## Prompt 3: Scaffold the app
Create the Next.js (App Router, TypeScript) project from SPEC.md. Add package.json scripts: lint, typecheck, test, build, verify (runs all four plus a dependency audit). Add .env.example with names only. Add a basic CI workflow that runs verify. Run verify and fix anything failing.

## Prompt 4: Translate the prototype
Turn the approved prototype into real components and pages. Use CONTENT.md copy. Leave visible [CONFIRM] markers out of the production build: fail the build if any remain. Add tests for the theme toggle and page rendering.

## Prompt 5: Evals before the chat
Create the eval sets from SPEC.md in /evals: 20 golden questions with expected chunk ids, 10 scope refusals, 10 prompt-injection attempts. Write the runner script `npm run eval`. It should fail if any scope or injection case is handled unsafely. Do not build the chat yet.

## Prompt 6: Ingest and retrieval
Write lib/embed.ts (provider interface plus one implementation) and the ingest script that splits docs/RESUME.md and approved project text into chunks with stable ids and stores them in Postgres with pgvector. Write a retrieval function and tests. Explain the read-only database role setup in docs/DB.md and give me the SQL.

## Prompt 7: Chat route with guards
Build the chat API route following the flow in SPEC.md exactly: rate limit, scope check, retrieve, answer from chunks only with chunk ids, server-side citation check, refusal if the check fails. Add lib/llm.ts as a provider interface. Input length limits. Errors reveal nothing about internals. Then run `npm run eval` and show me the results honestly, including failures.

## Prompt 8: Chat panel UI
Add the "Ask about my work" panel with starter questions, streaming if simple, visible citations, a clear refusal message. Keep it accessible and mobile friendly.

## Prompt 9: Security pass
Add a strict Content-Security-Policy with per-request nonces and standard security headers. Confirm no secrets reach the client bundle. Then run the security-reviewer subagent and show me its findings. Fix what is real, and tell me what you chose not to fix and why.

## Prompt 10: Consistency pass
Run the consistency-auditor subagent. It compares every claim on the site and README against docs/RESUME.md. Show me every mismatch. Fix the site, not the resume.

## Prompt 11: How it's built and README
Write the "How it's built" page and the README: what it is, stack, how to run it, security choices, how Claude Code was used (be accurate: what I decided, what Claude Code did), what is simple on purpose, known limits. Only describe what really exists.

## Prompt 12: Deploy
Give me the exact steps to deploy on Vercel from main, which environment variables to set, and how to run the ingest against production. Then give me a final pre-launch checklist: open every page on phone width, try 5 injection attempts myself, check resume vs LinkedIn vs site wording.

---

## Mid-project helper prompts
- "Stop. Before changing anything, explain what you are about to do and why."
- "What did you assume that is not in RESUME.md?"
- "Show me the three riskiest parts of this change."
- "Simplify this. Remove anything we do not need yet."
