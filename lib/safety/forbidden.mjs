// Wording that must never reach a visitor: used by the post-build scan
// (scripts/check-built-output.mjs), the chat output guard and the evals.
// Pure data, no file access, so the chat route can import it without pulling
// anything else into its bundle.

// `everywhere: true` rules also apply to the bundled guard code in the post-build
// scan; the rest apply to everything else. The guard's own bundle is recognised by
// GUARD_SENTINEL, which is embedded in the first rule so it always ships with it.
export const GUARD_SENTINEL = "portfolio-output-guard-v1";

/** @type {{ pattern: RegExp, why: string, everywhere?: boolean }[]} */
export const FORBIDDEN = [
  { pattern: /\[\s*CONFIRM/i, why: `unapproved [CONFIRM] text (${GUARD_SENTINEL})` },
  { pattern: /\[\s*INTERVIEW[\s_-]*ONLY/i, why: "interview-only tag" },
  { pattern: /\[\s*PUBLIC[\s_-]*GENERAL/i, why: "resume tag leaked into the site" },
  {
    pattern: /\b(5|five)\s*\+?\s*(years?|yrs)\b|\b(5|five)\s+or\s+more\s+(years?|yrs)\b/i,
    why: '"5+ years", "5 years" or a rounded-up equivalent is not approved',
  },
  { pattern: /docs[\\/]+private/i, why: "reference to private notes", everywhere: true },
  { pattern: /crew[\s_-]*scheduling|r[eé]servations?\b/i, why: "employer system specifics" },
];
