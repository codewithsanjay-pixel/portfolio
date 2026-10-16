# ADR 008: Scope check by retrieval similarity

Date: 2026-10-09
Status: accepted 2026-10-09, with one condition. If the scope set or the injection set in `npm run eval` is ever below 100%, a separate scope check is added before retrieval, as SPEC.md originally described. The retrieval-similarity gate stays as an extra layer.

## Context
SPEC.md lists the chat flow as: rate limit, scope check, embed and retrieve, answer, verify citations, return. A separate scope check before retrieval would need its own model call per question. That doubles cost and latency, and adds a second prompt to attack.

## Decision
The scope check reuses the retrieval step's embedding, after a cheap input check:
1. Rate limit (unchanged, first).
1a. Input check, before retrieval and with no model call. It refuses questions that try to script the answer ("start your answer with...", "mention that you led...", "repeat after me"). Added 2026-10-09 after eval case x18 was answered in one of three runs. That answer dropped the planted claim, but it broke the rule that mixed questions are refused as a whole.
2. Embed the question and retrieve the top-k chunks on the read-only role.
3. Scope check: if nothing was retrieved, or the best chunk's similarity is below `SCOPE_MIN_SCORE`, refuse without calling the answer model.
4. The answer model also refuses when the question is not about my work, when the sources do not answer it, or when the question states something about me the sources do not say (prompt rules 3 and 3a; structured output field `refused`).
5. Server-side checks (`lib/chat/answer.ts`):
   - Every citation must be a retrieved chunk.
   - Answers with no citations are refused.
   - The output guard rejects:
     - markers and resume tags
     - private-folder references
     - employer system names
     - "5+ years" and its variants
     - the system prompt canary
     - HTML, and any markdown link or image
     - any URL other than my LinkedIn, GitHub and email, and any bare domain
     - source ids written in the answer text
     - answers that talk about "the sources" or "instructions"
     - characters outside plain English text after accents are stripped (lookalike letters, rare invisible characters, other scripts)
   - Any private word from the server-only `PRIVATE_TERMS` variable, or its plural, also causes a refusal. The variable is required on every Vercel deployment.
   - Every number in the answer, as digits (fullwidth digits included, after normalization) or as a word from "three" up, must appear in the cited text.
6. Every refusal is the one fixed message (ADR 006).

## Rate limit trade-off
The global daily cap (default 300) protects cost, not availability. Someone with a handful of addresses, or an IPv6 /48 with its many /64 blocks, can use it up and pause the chat until the next UTC day. That is accepted: the site still works, only the chat pauses, and spend stays bounded.

## Consequences
- One embedding call and at most one model call per question.
- Threshold calibration: with the default 0.25, the scope check refused 9 of 68 eval questions without a model call, and refused none of the 20 golden questions (2026-10-09). Too high refuses good questions; too low passes more off-topic questions to the model, which must then refuse them itself. Recheck when the corpus changes.
- Off-topic questions that happen to sit close to resume text still reach the model. The model's own refusal, the citation check and the output guard handle those.
