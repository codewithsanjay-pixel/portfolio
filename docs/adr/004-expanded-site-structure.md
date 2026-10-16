# ADR 004: Expanded site structure

Date: 2026-10-08
Status: accepted 2026-10-08. SPEC.md updated. The Notes-in-corpus question below is still open.

## Context
SPEC.md lists six pages and a chat panel. The owner asked to expand the design using a peer's site for structure and pattern only (see docs/REFERENCE-NOTES.md). Copy for every new section is drafted in docs/CONTENT.md from docs/RESUME.md only.

## Decision
Change the "Pages" section of SPEC.md to the following.

Home page, one scrolling page, in this order:
1. Intro: headline, subline, proof points (once approved), links. Chat panel beside it on wide screens, below it on phones.
2. Focus: three areas, two sentences each. Unchanged.
3. Experience: a timeline, newest first. American Airlines role, M.S., American Express role. Each entry shows title, employer, place and dates, plus a one-line summary, and expands to grouped detail.
4. Skills: the resume's skill groups, with names lightly shortened. Filter chips (All plus one per group). Each skill is tagged with where the resume shows it in use (AA, Amex, EKA). Untagged skills are shown plainly.
5. Projects: three cards. The Enterprise Knowledge Assistant links to its own page. The two role cards link to their timeline entries.
6. Notes: up to five short opinion pieces. Each is shown only after the owner approves it.
7. About and Contact. Unchanged.

Separate pages:
- /projects/enterprise-knowledge-assistant: problem, how it fits together (component diagram, no internal systems), what I owned, quality, stack, what the page leaves out.
- /how-its-built: numbered sections, each linking to the repo files that implement it.

Interaction rules:
- Expand and collapse use native `<details>` and `<summary>`. They work without JavaScript and with a keyboard.
- Skill filters are a small client script. Without JavaScript, all skills show.
- No tabs, carousels, floating widgets or headline counters.

Content rules, added to SPEC.md:
- Notes are not a blog: a fixed set of short pieces in the page, with no dates, feed or CMS. The "no blog" item in Out of scope still applies.
- "Where used" tags come only from resume bullets.
- The project page restates resume text only.

## Chat corpus
The corpus stays as SPEC.md says: docs/RESUME.md and approved project text.

Approved Notes may be added as a separate source labelled "notes", so the assistant can answer "how do you think about X" questions and cite them as opinion.
This would also change CLAUDE.md rule 5 ("answers only from retrieved resume and project text") and SPEC.md's corpus line. Both would be updated if approved.
[CONFIRM: include approved Notes in the chat corpus, yes or no.]

## Consequences
- Step 4 grows: three more home sections, two pages, and the skill filter with tests. The prototype gets updated first, for review.
- The eval golden set (step 5) adds questions about experience and skills.
- More visible text means more for the consistency-auditor to check. The rule against shipping [CONFIRM] keeps unapproved Notes, proof points and About text off the site.
- Nothing new is claimed about me. Every added line comes from the resume, or is marked [CONFIRM] and hidden until approved.
- Claims about the site itself (How it's built) are checked against the code when that page is written. Each section links to the files that back it.
