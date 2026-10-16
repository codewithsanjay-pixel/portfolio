# Start here

This kit gives Claude Code everything it needs to build your portfolio the way a peer engineer described, without copying his site. Read this file first, then follow the order below.

## What is in the kit
- CLAUDE.md (project root): rules Claude Code reads automatically at the start of every session.
- docs/RESUME.md: your facts. The only source of truth. Fill in the placeholders.
- docs/CONTENT.md: draft site copy built only from the resume. Rewrite in your own voice.
- docs/SPEC.md: the locked build plan.
- docs/REFERENCE-NOTES.md: notes on his pattern, in plain words, for ideas only.
- docs/PROMPTS.md: the prompts to paste, in order.
- .claude/agents/: two review helpers (consistency-auditor, security-reviewer).

## Is Claude Code enough?
For the code, yes. It can plan, write, test and review. But it cannot do these for you:
1. Decide what is true. Only you know which projects are public, which numbers you can state, and how to describe the gap between Amex and American Airlines.
2. Create accounts and keys. You need a GitHub account, Vercel, a Postgres database with pgvector (Neon or Supabase), Upstash Redis, and an API key for one LLM and one embedding model.
3. Pay for it. Claude Code needs a Claude subscription or Console account. Vercel hobby, Neon, Supabase and Upstash have free tiers. LLM calls cost small amounts.
4. Judge the result. Open the site, try to break the chat, read every sentence.

## Before you start (about 1 hour)
- [ ] Install Claude Code and log in. Check the official install page, since commands change.
- [ ] Install Node (current LTS) and Git.
- [ ] Create a GitHub repo named something plain (for example `portfolio`). Public, because he will look.
- [ ] Create Vercel, Neon (or Supabase), Upstash accounts. Do not paste keys into chat. Put them in .env.local and Vercel settings only.
- [ ] Pick one LLM provider and one embedding provider.
- [ ] Fill in docs/RESUME.md placeholders: name, email, LinkedIn, GitHub.

## Decisions only you can make
1. Is the Enterprise Knowledge Assistant personal or employer work? If employer, keep it generic.
2. What can you say publicly about American Airlines and American Express? When unsure, say less.
3. Which real numbers can you state? If none are approved, leave them out.
4. How to describe January 2024 to January 2025. Just tell the truth in one plain line.
5. Graduation date: confirm it.

## Order of work
1. Put the kit in a new folder, `git init`, and add the files as shown.
2. Run `claude --permission-mode plan`.
3. Paste Prompt 0 from docs/PROMPTS.md. Answer its questions.
4. Work through prompts 1 to 12. Run `npm run verify` and commit after each.
5. Tell that engineer only when it is live and you have tested it.

## Habits that matter to people like him
- Small commits with clear messages.
- Never claim something the site does not do.
- Read what Claude Code wrote. You must be able to explain every part in an interview.
- Keep the site smaller than your ambition.

## Timeline
You told him about a week. A realistic plan: day 1 setup and content, days 2 to 3 wireframe and pages, days 4 to 5 evals and chat, day 6 security and review, day 7 deploy and test.

## Things to avoid
- Copying his text, design, name or numbers.
- Fabricated metrics.
- Putting secrets in the repo.
- Letting Claude Code add features not in the spec.
- Sending him the link before you have tried to break it yourself.
