# ADR 016: Eval results come from a committed summary file

Date: 2026-10-19
Status: accepted

## Context
The "How it's built" table and its caption date were typed by hand in `content/site.ts`. A typed pass count can drift from the real latest run, which is the kind of claim this site says it avoids.

## Decision
- `npm run eval` writes `evals/public-summary.json` after a run: the time, the short git commit (or null), and `cases` and `passed` for the four public sets (golden, scope, injection, extra). It is written only when all four sets were evaluated in full.
- The file never holds the private set, questions, ids or answers. `tests/eval-summary.test.ts` checks the shape, the set names, that case counts equal the lengths of `evals/*.json`, and that `passed` does not exceed `cases`.
- `lib/evals/summary.ts` imports and validates the file. `content/site.ts` takes the table's `passed` values and the caption date from it. The date is formatted in America/Chicago, for example "19 October 2026".
- The file is committed on purpose: the deployed site shows the result of the last run that someone committed. Run the evals, then commit the updated file with the change it tested.
- `evals/results/latest.json` stays git-ignored and keeps the full per-case detail.

## Consequences
- No hand-typed pass counts or run dates. A stale number is possible only if someone does not commit the file after a run.
- A failing run still writes its true counts, so a failure cannot be hidden by keeping old numbers.
- The seed values (20, 10, 10 and 31 cases, all passed, 19 October 2026) come from the latest real run. Zero new runtime dependencies.
