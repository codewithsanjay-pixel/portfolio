// Server-only configuration. Names match .env.example. Values never reach the client:
// nothing here is NEXT_PUBLIC_, and only server code imports this file.

export type Env = Record<string, string | undefined>;

export function requireEnv(name: string, env: Env = process.env): string {
  const value = env[name]?.trim();
  // The message names the variable, never its value.
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

export function intEnv(name: string, fallback: number, env: Env = process.env): number {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Environment variable ${name} must be a positive integer.`);
  return n;
}
