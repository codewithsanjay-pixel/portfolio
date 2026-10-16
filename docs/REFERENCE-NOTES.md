# Reference notes (structure ideas only)

These are my own notes on a peer's public portfolio and his public article. Use them to understand the pattern. Do not copy his wording, design, imagery, branding or claims.

## What his site does (pattern)
- Opens with one positioning line and a few headline numbers.
- Sections: focus areas, projects (expandable, with specifics), an interactive explorer, about, contact, and a separate "how this was built" page.
- A chat assistant that answers from his resume and cites sources.
- Honest labels: shipped work is separated from work that is under review.
- A theme toggle (light and dark) driven by CSS variables.

## How he says it was built (from his build page)
- Wireframe first as one static prototype, then translated into components.
- Design decisions recorded in a short design brief and decision records.
- Next.js with TypeScript on Vercel; retrieval over Postgres with pgvector; rate limiting in Redis; a strict content security policy.
- Agentic build process: Claude Code planned against a locked spec, used subagents for parallel review work, and every change ran lint, build and tests before push.
- Push-to-deploy from the main branch.

## Ideas from his article (in my own words)
- Put effort into durable parts (tools, domain knowledge, memory, data access control, streaming) and keep orchestration thin and replaceable.
- Enforce access control at the data layer, not in the prompt. Identity should travel with the request, and a tool should refuse to run without it.
- Start with one agent and good tools. Add complexity only when measurements show it is needed.
- Write evals before capabilities and use them to decide when to expand what the agent may do.

## What I take from this
- Lock a spec, build in small steps, verify before every commit, and write down decisions.
- Show the same disciplines in my own project: clear tool contracts, access control below the prompt, evals, honest labels.
- Keep my site smaller and entirely my own.

## What NOT to copy
- His text, name, portrait, purple branding, project claims, numbers, or the exact look of his pages.
- His chat assistant's wording or tiers. Mine should be simpler and built from my own corpus.

## What he is likely to check
- Does the site load, work and look intentional?
- Do my claims match my resume and LinkedIn?
- Is the chat assistant honest and hard to misuse?
- Is there a real repo with a clear README?
