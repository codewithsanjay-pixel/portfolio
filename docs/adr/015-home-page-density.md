# ADR 015: Home page density

Date: 2026-10-19
Status: accepted (the owner approved the UI changes; no wording about the owner's work changes)

## Context
The home page was long for a reader in a hurry. The skills list was a full section of chips and lists, section padding was generous, and the hero's left column ended well above the chat panel.

## Decision
- Wrap the skills explorer in one native `<details>` (closed by default) with the summary "Show skills by area". The skills are still in the server HTML, and the control works with the keyboard and without JavaScript. The section title "Skills" is unchanged.
- Reduce section and hero padding on the home page only, through a `.home` wrapper.
- Make the Focus cards compact (3 across from 48rem, stacked below).
- Pin the hero fact tiles to the bottom of the left column on wide screens so the column lines up with the chat panel.
- No sticky in-page section indicator.

## Consequences
- Section order and ids are unchanged. `tests/pages.test.tsx` checks the skills disclosure.
- Styles are in `app/pages.css`, with no style attributes, so the CSP from ADR 009 is unchanged. No new dependencies.
