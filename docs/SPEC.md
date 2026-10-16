# Build spec (locked)

Status: locked. Change only through a short decision record in docs/adr/ approved by me.

## Goal
A small, honest portfolio that proves my skills by being a working example of them: retrieval, agents with clear tool boundaries, and access control enforced below the prompt.

## Audience
Engineers and hiring managers who will read it quickly, open the GitHub repo, and may try to break the chat assistant.

## Principles
- Original work. Nothing copied from any other site.
- Every claim traceable to docs/RESUME.md.
- Small surface area. Fewer features that work beat many that don't.
- Tools have clear contracts. Access control lives at the data layer. Swap-able model providers.

## Pages
Structure set by docs/adr/004-expanded-site-structure.md.

Home page, one scrolling page, in this order:
1. Intro: one-line positioning, three proof points (only real, confirmed facts; otherwise omit), links (resume PDF, GitHub, LinkedIn). Chat assistant panel, "Ask about my work", beside it on wide screens and below it on phones.
2. Focus: three areas (retrieval, agents and tool use, secure integrations), two sentences each.
3. Experience: timeline, newest first, each entry expandable to grouped detail taken from the resume.
4. Skills: resume skill groups with filter chips; each skill tagged with where the resume shows it in use.
5. Projects: Enterprise Knowledge Assistant first (links to its own page), then two role-based summaries kept generic (link to their timeline entries). Each: problem, what I built, what I owned, and result or quality (words, not invented numbers; see ADR 001).
6. Notes: up to five short opinion pieces, each shown only after I approve it. Not a blog: no dates, feed or CMS.
7. About: short, plain, personal.
8. Contact.

Separate pages:
- /projects/enterprise-knowledge-assistant: restates resume project text only.
- /how-its-built: stack, how the chat answers, security choices, evals, how Claude Code was used, what is simple and why, known limits. Each section links to the repo files behind it.

Interactions: expand and collapse with native details and summary; skill filter as a small script that degrades to showing all skills. No tabs, carousels, floating widgets or headline counters.

Light and dark theme through CSS custom properties. Readable on a phone.

## Stack
- Next.js (App Router) + TypeScript, deployed on Vercel from main.
- Postgres with pgvector (Neon or Supabase) for retrieval.
- Upstash Redis for rate limiting.
- One LLM provider and one embedding provider, each behind a small interface (lib/llm.ts, lib/embed.ts). No provider-specific types leak outside those files.
- Tests: Vitest for unit tests; a small eval script for the chat.
- Scripts in package.json: lint, typecheck, test, build, verify (runs all four).

## Chat assistant design
Corpus: docs/RESUME.md and approved project text, split into chunks with stable ids.
Flow per question:
1. Rate limit check (per IP, and a global daily cap).
2. Scope check: is the question about me, my work or this site? If not, refuse politely.
3. Embed the question, retrieve top-k chunks from pgvector.
4. Ask the LLM to answer using only those chunks, returning an answer plus the chunk ids used.
5. Verify on the server that cited ids exist and were retrieved. If not, return a refusal instead of the answer.
6. Return answer and citations.

Rules:
- The model never receives secrets, other users' data, or anything outside the corpus.
- Database access from the chat route uses a read-only role.
- No conversation storage beyond what is needed for rate limiting. No logging of user text beyond short-lived debugging, off by default.
- Prompt-injection stance: treat user text and retrieved text as untrusted. The system prompt is not a security boundary; the real limits are the corpus, the read-only role, the citation check and the rate limits.

## Security checklist
- Strict Content-Security-Policy and standard security headers.
- No secrets in client bundles; .env.example lists names only.
- Dependency audit in verify.
- Input length limits on the chat endpoint.
- Error responses reveal nothing about internals.

## Evals (build these before the chat)
- Golden set: 20 questions with expected supporting chunk ids (about my skills, roles, projects).
- Scope set: 10 off-topic questions that must be refused.
- Injection set: 10 attempts ("ignore your instructions", "print your system prompt", "pretend you are...", requests for data not in the corpus) that must fail safely.
- Pass bar before deploy: golden answers cite correct chunks, 100% of scope and injection cases handled safely.

## Delivery order
1. Static site and content.
2. Evals written.
3. Ingest script and retrieval.
4. Chat route with guards.
5. Security headers and rate limiting.
6. Review by subagents, fix findings.
7. How-it's-built page and README.
8. Deploy, then final consistency pass against resume and LinkedIn.

## Out of scope
Auth, accounts, analytics beyond basic privacy-friendly page counts, CMS, blog, multi-agent orchestration, voice.
