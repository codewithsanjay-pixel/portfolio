# Portfolio

The source code of my portfolio site (Sanjay Kandimalla, backend engineer). It has a home page, a page about the Enterprise Knowledge Assistant, a "How it's built" page, a "Trust and limits" page, a read-only MCP page, and a chat called "Ask about my work". The chat answers only from my resume, shows which sections it used, and refuses everything else.

It is a small example of how I build retrieval and agent-style systems: limits enforced in code and in the database, not only in a prompt, and evals written before the feature.

## Extras

- The chat can stream its steps as server-sent events (`Accept: text/event-stream`). The protocol is in `docs/CHAT-EVENTS.md`.
- `/api/mcp` is a read-only MCP server over HTTP with three tools (`lib/mcp/`). It uses the same retriever, database role, output guards and rate limiter code as the chat, with its own counters. See `docs/adr/013-read-only-mcp-server.md`.

## Stack

- Next.js (App Router) with TypeScript, built to run on Vercel
- Postgres with pgvector on Neon, for retrieval
- Upstash Redis, for rate limits
- OpenAI for embeddings and answers, each behind one small file (`lib/embed.ts`, `lib/llm.ts`)
- Vitest for tests, plus a separate eval run for the chat

The runtime dependencies are Next.js, React and Neon's database client.

## Run it locally

You need Node 20.9 or newer, a Neon Postgres database with the pgvector extension, an Upstash Redis database, and an OpenAI API key.

1. Install packages: `npm install`
2. Copy `.env.example` to `.env.local` and fill in each name. Keep real values out of git. `.env.example` lists names only.
3. Put the owner connection string in `.env.local` as `DATABASE_URL`, then load the resume: `npm run ingest`. This creates the table (`db/schema.sql`) and stores the chunks.
4. Create the chat's read-only database role with the SQL in `docs/DB.md`, put its connection string in `.env.local` as `DATABASE_URL_READONLY`, and run `npm run db:check`.
5. Start the site: `npm run dev`

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build, with checks for secrets, markers and private wording in the output |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests |
| `npm run eval` | Runs every eval case against the real chat (needs the services above) |
| `npm run ingest` | Splits `docs/RESUME.md` into chunks, embeds new or changed ones, and syncs the database table (uses the owner role) |
| `npm run db:check` | Checks that the chat's database role can read the chunks table and cannot change anything |
| `npm run check:csp` | Starts the built site and checks the security headers and nonces |
| `npm run audit` | Dependency audit for production packages |
| `npm run verify` | Lint, typecheck, tests, build, CSP check and audit. Run before every commit |

## How the chat answers a question

Every question goes through the same steps: rate limit, input check, retrieval, scope check, answer with chunk ids, citation check, output checks. If a step from the input check onward fails, the visitor gets one fixed refusal and no sources. Each response also carries a request trace (the result and timing of each step, and the retrieved section names with scores for answered questions), which the site shows under the answer. Rate limits, malformed requests and outages show a short error message instead. The "How it's built" page describes each step and links to the code. The chat route is `app/api/chat/route.ts` and the checks are in `lib/chat/answer.ts`.

## Trust and limits page

`/trust` says what the chat assistant is and is not, and lists each control with a link to the file that enforces it (`app/(site)/trust/page.tsx`, copy in `content/site.ts`). A test checks that every linked file exists and is tracked by git. The page also has a "Try to break it" panel (`components/break-it.tsx`): it sends the questions from the public injection set (`evals/injection.json`) to the live chat, one at a time, and shows what the eval expects next to what happened, with the trace. Questions that use wording the site never prints are left out of the page. Those questions count against the same rate limits as the chat. Decision record: `docs/adr/014-trust-page-and-break-it.md`.

The home page hero has three small tiles. Their numbers are computed from the repository when the page renders (eval case total from the table in `content/site.ts`, runtime dependency count from `package.json`), and each links to where it can be checked.

## Security choices

- The chat connects to the database as a read-only role.
- Strict Content-Security-Policy with a new nonce on every request (`proxy.ts`, `lib/security/csp.mjs`), plus the standard security headers.
- Secrets only in server-side environment variables. The build fails if a secret value shows up in the built output.
- Input limits and rate limits on the chat route. No stored conversations; by default only the event, counts, timing and error reasons are logged.
- The system prompt is not the security boundary. The corpus, the read-only role, the citation check, the output checks and the rate limits are.

## Evals

The sets are in `evals/`: golden questions that must be answered, scope questions that must be refused, injection attempts that must be refused, and an extra safety set. `evals/README.md` explains how each case is graded. Current results are on the "How it's built" page.

## How I used Claude Code

Claude Code wrote most of the code and tests. I set the rules (`CLAUDE.md`) and the spec (`docs/SPEC.md`), supplied and approved every fact about me, and decided what stays private. Changes to the locked spec were proposed first and recorded in `docs/adr/` after I approved them. Every change had to pass `npm run verify`, and two review helpers in `.claude/agents/` (one for facts, one for security) were run before each phase was closed.

## Simple on purpose

No accounts, comments or content system. One language-model provider and one embedding provider. No separate vector database. No animation libraries, carousels or tabs.

## Known limits

- A language model can still get things wrong. The checks stop invented sources, numbers, names and links, but cannot prove every sentence is a fair summary.
- The evals are small and I wrote them. Model answers are not perfectly repeatable.
- The scope check compares meaning, so some off-topic questions near resume text can reach the model.
- Rate limits can turn away a real visitor who asks many questions.
- The chat depends on OpenAI, Neon and Upstash.
- No automated browser tests. I checked the pages and the chat by hand.

## Decisions

Design decisions are recorded as short notes in `docs/adr/`.
