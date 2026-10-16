# ADR 003: Dependency audit covers production packages

Date: 2026-10-08
Status: accepted

## Context
SPEC.md puts a dependency audit in `npm run verify`. At scaffold time, `npm audit` reports a high severity advisory (GHSA-vfj7-8cjw-p6xm) in `braces` 3.0.3. It arrives through `eslint-config-next` 16.4.0 > `@next/eslint-plugin-next` > `fast-glob` > `micromatch` > `braces`. No patched `braces` release exists yet, and npm's only suggested fix is downgrading `eslint-config-next` to 14.x, which does not match Next 16.

The package is used only by the linter, on this repo's own files and glob patterns. It is not part of the built site or the chat route.

## Decision
`npm run audit` runs `npm audit --omit=dev --audit-level=high`. Verify fails on any high or critical advisory in packages that ship to production.

Dev-only advisories are checked by hand with a full `npm audit` at each phase review and before deploy. This one gets re-checked then, and the exception is removed once a fixed version is available.

## Consequences
Verify does not block on this lint-only issue. A new dev-only advisory would not fail verify, which is why the full audit stays on the phase review checklist.
