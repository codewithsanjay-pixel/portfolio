// Loads .env.local for scripts run on my machine. Never prints values.
import { existsSync } from "node:fs";
import { join } from "node:path";

export function loadLocalEnv(root = process.cwd()): void {
  const file = join(root, ".env.local");
  if (existsSync(file) && typeof process.loadEnvFile === "function") process.loadEnvFile(file);
}
