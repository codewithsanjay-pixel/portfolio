# ADR 012: Streaming chat events and prompt independence

Date: 2026-10-19
Status: accepted (I approved backend and frontend changes on 2026-10-19; no facts or wording about me change)

## Context
The request trace from ADR 011 only appeared after the answer arrived, so a visitor could not watch the checks run. Separately, the claim that safety lives in code and not in the system prompt was only an argument, with no test that proved it.

## Decision
- `POST /api/chat` still returns JSON. With `Accept: text/event-stream` it streams typed, versioned events: `stage` when a step passes, then one `final` (the JSON body) or `error`. The protocol is in `docs/CHAT-EVENTS.md`.
- The rate limit, content type, size and body checks run before any stream starts and return the normal JSON errors.
- `answerQuestion` takes an optional `onStep` callback that is called only for steps that pass. The checks after the model are one `checks` step, sent only if all of them passed. The step that stopped a refusal appears only in the final trace, as in ADR 011.
- The chat panel reads the stream, validates every event, ignores unknown ones, and renders text only. The answer always comes from the `final` event.
- The system prompt becomes a dependency (`ChatDeps.systemPrompt`). `tests/prompt-independence.test.ts` runs the flow with an empty prompt and forged model output, and each case must be refused.
- No new dependencies and no style attributes, so the CSP from ADR 009 is unchanged.

## Consequences
- Visitors see the steps light up while they wait. Total time does not change.
- A stream gives away nothing the final trace does not: timing between stages is the same signal as the step timings already shown.
- Changing or deleting the prompt cannot weaken a check. The tests fail if a check starts to rely on it.
- Two response formats to keep in step. Tests compare the `final` event with the JSON body.
