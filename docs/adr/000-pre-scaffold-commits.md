# ADR 000: Commits before the app scaffold skip verify

Date: 2026-10-08
Status: accepted

## Context
CLAUDE.md rule 6 says to run `npm run verify` before every commit. That script only exists once the Next.js app is scaffolded (PROMPTS.md step 3). The first commits are docs and a static HTML prototype, so there is nothing to lint, typecheck, test or build yet.

## Decision
Commits made before step 3 may skip `npm run verify`. This covers the kit docs, fact fixes and the static prototype only.

From the step 3 scaffold commit on, rule 6 applies with no exceptions.

## Consequences
The early commits are checked by hand and by the consistency-auditor subagent instead of by verify.
