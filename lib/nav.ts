export type NavLink = { href: string; label: string; flag?: boolean };

// The local-only example (ADR 005) is linked only when SHOW_EXAMPLE is exactly
// "true", and never in a Vercel or CI build.
export function exampleLinkEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const hosted = Boolean(env.VERCEL || env.VERCEL_ENV || env.CI);
  return env.SHOW_EXAMPLE === "true" && !hosted;
}

export function withExampleLink(links: readonly NavLink[], enabled: boolean): NavLink[] {
  return enabled ? [...links, { href: "/example", label: "Example", flag: true }] : [...links];
}
