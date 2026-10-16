# Design brief

Status: draft, follows the step 1 prototype. Changes when the prototype review changes it.

## Feel
Quiet and readable, like well-kept engineering notes. The work is the focus; the design stays out of the way. Original to this site: no purple, no borrowed layouts or wording.

## Color
All colors are CSS custom properties on `:root`. Light is the default. Dark follows the OS setting unless the visitor picks a theme with the toggle, and that choice is saved.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #f6f5f1 | #121416 | page background |
| `--surface` | #ffffff | #1a1d20 | cards, chat panel |
| `--band` | #eeece6 | #16191b | alternating section background |
| `--text` | #1c1d1f | #e8e6e1 | body text |
| `--muted` | #595d62 | #a3a7ab | secondary text, labels |
| `--border` | #d9d6ce | #2f3337 | lines and outlines |
| `--accent` | #1d6b58 | #5fc4a6 | links, buttons, highlights (deep green) |
| `--accent-soft` | #e1eee8 | #1b2e28 | tags, user chat messages |

Text and accent colors must meet WCAG AA contrast on their backgrounds in both themes.

## Type
- Body: the system font stack (`system-ui`, Segoe UI, Roboto and fallbacks). No web fonts, so nothing loads from other servers and the security policy stays simple.
- Labels, section titles, tags: the system monospace stack, small and uppercase with light letter spacing. This marks structure without adding a second display font.
- Body size about 17px with line height 1.6. Headline scales from about 30px on phones to 44px on desktop.

## Spacing and layout
- Content width up to about 68rem; reading text up to about 44rem.
- Sections have about 3.5rem of vertical padding. Cards use 1.25rem padding and 10px corners.
- Mobile first. Grids become two or three columns from about 48rem. On wide screens the home intro and the chat panel sit side by side.
- Sticky header with name, section links and the theme toggle. On phones the links move to their own row.

## Components
- Proof points: short lines with a green left border.
- Project cards: the lead project has a green top border and labelled rows (Problem, What I built, What I owned, and Result or Quality, see ADR 001).
- Chat panel: title, one-line note on how answers work, message log, starter question chips, input with a 500 character limit.

## Accessibility
Skip link, visible focus outline on every control, labelled inputs, `aria-pressed` on the theme toggle, a polite live region for chat messages, and respect for reduced motion.

## Tone of copy
Plain words, first person, short sentences. No hype, no buzzwords, no em dashes. Every claim traceable to docs/RESUME.md.
