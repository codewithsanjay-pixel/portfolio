// Config for `npm run eval` only. Kept apart from unit tests because evals call the real chat.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["evals/**/*.eval.ts"],
    reporters: ["default"],
    silent: false,
  },
});
