# ADR 011: Visual redesign and a public request trace

Date: 2026-10-19
Status: accepted (I approved this on 2026-10-19: "i am approving backend and front end ... you can change"; no facts or wording about me change)

## Context
The site was a clean but ordinary portfolio. The strongest thing it has is the chat assistant and the checks around it, and a visitor could not see any of that working.

## Decision
- Add a public request trace to `/api/chat`: six steps (rate limit, input check, retrieval, scope check, model, answer checks) with timings, and the retrieved sections with similarity scores. Built in `lib/chat/trace.ts`.
- Every refusal that happens after the model collapses into one "answer checks" step, so the trace cannot reveal whether the private-word check or the grounding check fired. The refusal text stays one fixed message.
- The trace carries section headings and scores only. No chunk ids and no passage text.
- Add a "How the chat works" section after the hero, a Ctrl+K command palette, and a CSS-only visual layer (scroll-driven reveals, a reading progress bar, an animated gradient edge on the chat panel).
- SPEC.md lists the home sections; this adds `pipeline` first. The spec order test is updated to match.
- Zero new runtime dependencies. Motion is CSS and sits behind `prefers-reduced-motion` and `@supports (animation-timeline: ...)`. No style attributes, so the CSP from ADR 009 is unchanged.

## Consequences
- The route response gains a `trace` field. The client validates its shape and drops anything unexpected.
- Older browsers (for example Firefox without scroll-driven animations) show the same page without the reveal effects.
