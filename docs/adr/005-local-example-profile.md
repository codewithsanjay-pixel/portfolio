# ADR 005: Local-only fictional example profile

Date: 2026-10-08
Status: accepted

## Context
I want a fictional "ideal" backend AI engineer profile to compare against my real site, so I can see what detail mine is missing. It uses invented metrics and employers, so it must never ship, reach the chat corpus, or sit in the public repo.

## Decision
- The example lives only in `content/example/` and `app/example/`, at the route `/example`. Persona "Alex Sample", employers "Example Airline" and "Example Payments". Deleting the two folders removes it completely.
- Both folders are in `.gitignore`. They stay on my computer.
- Second safeguard: a build guard (`scripts/example-guard.mjs`) fails the build while either folder exists. It runs twice:
  - in `npm run build`, through `scripts/check-example.mjs`
  - inside `next.config.ts`, so any `next build` hits it

  For a local build, `ALLOW_EXAMPLE_BUILD=true` in `.env.local` overrides it. On Vercel or CI (`VERCEL`, `VERCEL_ENV` or `CI` set), the override is ignored and the build always fails.
- `.vercelignore` keeps the folders, the prototype and env files out of any upload made from my machine with the Vercel CLI.
- Third safeguard: after every build, `scripts/check-built-output.mjs` fails if example routes, `/example` links or example text are in `.next`, unless this is a local build with the override. Never deploy with `vercel deploy --prebuilt` from my machine, because that uploads local build output. Deploy only from GitHub.
- The nav link is also off whenever `VERCEL`, `VERCEL_ENV` or `CI` is set.
- The header shows an "Example" link only when `SHOW_EXAMPLE=true`, again set only in `.env.local`.
- Isolation, enforced by tests in `tests/example-isolation.test.ts`:
  - The chat corpus source list (`lib/corpus/sources.ts`) may not include example paths.
  - Corpus sources may not contain the example's names.
  - Code outside the example folders may not reference them.
  - Git tracks no file in them, even one added with --force.
  - The example's names appear in no tracked file and in no other folder on disk.
  - The example folders may not contain my name, employers or links.
- The dev server listens on 127.0.0.1 only, so the example is not reachable from my local network.
- The consistency-auditor skips the example folders.
- Example pages carry "Example profile. Fictional." in the footer and ask search engines not to index them.
- This is a narrow exception to CLAUDE.md rule 1 (never invent facts). The invented content describes a fictional person, never me, and never leaves my machine.

## Consequences
- With the example present, local `npm run verify` needs `ALLOW_EXAMPLE_BUILD=true` in `.env.local`. CI and Vercel never have the folders.
- Still to do:
  - The ingest step stores each chunk's source path and calls `assertCorpusSource` for every file.
  - The chat route step rejects any retrieved chunk whose source is not in `CORPUS_SOURCES`, so a mistaken one-off ingest cannot leak example text.
  - When the real header is wired up, it must build its links with `withExampleLink(links, exampleLinkEnabled())` on the server, and the variable must never be `NEXT_PUBLIC_`.
- The gap analysis that compared the example with my content is kept local only (git-ignored), not committed.
