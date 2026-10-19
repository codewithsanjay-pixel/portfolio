# ADR 010: Allow Vercel's own NEXT_PUBLIC_VERCEL_ variables in the build check

Date: 2026-10-19
Status: accepted (I approved this on 2026-10-19, revised the same day)

## Context
`scripts/check-built-output.mjs` fails the build if any `NEXT_PUBLIC_` variable exists, because Next.js copies those into browser code. On the first Vercel deploys the check failed on names Vercel adds itself, such as `NEXT_PUBLIC_VERCEL_URL` and `NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG`. They are platform settings that Vercel sends to browsers by design. They are not my values and hold no secret of mine.

My first decision allowed only the one name that stayed after I switched off "Enable access to System Environment Variables". That did not work. Switching it off also removes `VERCEL_ENV`, so the check could not tell it was on Vercel, the "required secrets are present" check was silently off, and the rate limiter would not trust the visitor address header. The setting has to stay on.

## Decision
- Keep the system variables setting on.
- Allow names that start with `NEXT_PUBLIC_VERCEL_`, and only when `VERCEL_ENV` is set (a Vercel build).
- Every other `NEXT_PUBLIC_` name still fails the build, on Vercel and locally.
- The secret scan is unchanged: it still compares every real secret value against the whole build output.

## Consequences
- A variable I add myself under the `NEXT_PUBLIC_VERCEL_` prefix would be let through. I do not use that prefix, and the secret scan would still catch a real secret in the output.
- Test: `tests/check-built-output.test.ts` covers the allowed case, the local case and the blocked cases.
