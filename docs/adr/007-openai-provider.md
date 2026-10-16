# ADR 007: OpenAI for embeddings and answers

Date: 2026-10-08
Status: accepted

## Context
SPEC.md requires one LLM provider and one embedding provider, each behind a small interface. ADR 002 left the choice open.

## Decision
- OpenAI for both the chat model and the embedding model.
- My personal OpenAI account, with one project created just for this site. That project gets one API key, with a monthly spending limit set on the project.
- The key and model names live only in environment variables (`OPENAI_API_KEY`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`, `LLM_MODEL`). No model name is hard-coded.
- Model names come from OpenAI's own documentation at the time of setup, not from memory. On 2026-10-08 the docs listed:
  - `text-embedding-3-small` for embeddings. Default size is 1536, which matches `db/schema.sql`.
  - `gpt-6-luna` for answers. The docs describe it as "Our most efficient model for focused, high-volume tasks". It supports the Responses API and structured outputs.
- Provider code stays inside `lib/embed.ts` (embeddings) and `lib/llm.ts` (answers, step 7). No OpenAI types leave those files. Requests use plain `fetch` against the documented endpoints, so there is no SDK dependency.

## Consequences
- Visitor questions and the resume text retrieved to answer them are sent to OpenAI. The How it's built page says so.
- Running the private eval probes (ADR 006) also sends that private wording to OpenAI. Check the project's data controls before running them.
- Changing the embedding model or size means re-running `npm run ingest`. If the size changes, the vector column in `db/schema.sql` changes too.
- Spend is capped by the project's monthly limit, in addition to the rate limits in the chat route.
