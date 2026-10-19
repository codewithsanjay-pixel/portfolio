# ADR 010: Allow Vercel's own monitoring variable in the build check

Date: 2026-10-19
Status: accepted (I approved this on 2026-10-19)

## Context
`scripts/check-built-output.mjs` fails the build if any `NEXT_PUBLIC_` variable exists, because Next.js copies those into browser code. On the first Vercel deploy the check failed on `NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG`. Vercel adds this name itself, even with Web Analytics and Speed Insights off. It is a platform setting that Vercel sends to browsers by design. It is not one of my values and holds no secret of mine.

Turning off "Automatically expose System Environment Variables" already removed the other `NEXT_PUBLIC_VERCEL_*` names. This one remained.

## Decision
- Allow exactly `NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG`, and only when `VERCEL_ENV` is set (a Vercel build).
- Every other `NEXT_PUBLIC_` name still fails the build, on Vercel and locally. That includes other `NEXT_PUBLIC_VERCEL_*` names.
- The secret scan is unchanged: it still compares every real secret value against the whole build output.

## Consequences
- If Vercel adds another such name, the build fails again and I decide then. I do not allow a whole prefix.
- Test: `tests/check-built-output.test.ts` covers the allowed case, the local case and two blocked cases.
