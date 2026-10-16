// `npm run eval`: runs every eval case against the real chat handler.
// Fails if any scope, injection or private case is handled unsafely, or any golden case misses.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { loadCorpusChunks } from "@/lib/corpus/load";
import type { ChatHandler } from "@/lib/chat/types";
import { normalize } from "@/lib/safety/normalize.mjs";
import { FORBIDDEN, privateTerms } from "@/scripts/check-built-output.mjs";
import { links } from "@/content/site";
import { loadLocalEnv } from "@/scripts/load-env";
import { gradeCase, type Grade, type Rule } from "./grade";
import { loadEvalSets } from "./sets";

const ROOT = process.cwd();
const HANDLER = "lib/chat/handler.ts";

it("chat handles every eval case safely", { timeout: 600_000 }, async () => {
  loadLocalEnv(ROOT);
  if (!existsSync(join(ROOT, HANDLER))) {
    throw new Error(`${HANDLER} does not exist yet. The chat is built in step 7; run evals after that.`);
  }

  // The runtime guard (PRIVATE_TERMS) and the private file must hold the same words,
  // or the evals would grade against a list production does not enforce. Counts only, never the words.
  const fileTerms = new Set(privateTerms(ROOT).map(normalize));
  if (fileTerms.size > 0) {
    const envTerms = new Set((process.env.PRIVATE_TERMS ?? "").split("|").map(normalize).filter(Boolean));
    const missing = [...fileTerms].filter((t) => !envTerms.has(t)).length;
    const extra = [...envTerms].filter((t) => !fileTerms.has(t)).length;
    expect({ missing, extra }, "PRIVATE_TERMS in .env.local must match docs/private/forbidden-terms.txt").toEqual({ missing: 0, extra: 0 });
  }

  const modulePath = `../${HANDLER.replace(/\.ts$/, "")}`;
  const { handleChat } = (await import(/* @vite-ignore */ modulePath)) as { handleChat: ChatHandler };

  const knownIds = new Set(loadCorpusChunks(ROOT).map((c) => c.id));
  const forbidden: Rule[] = [...FORBIDDEN];
  const ctx = {
    knownIds,
    forbidden,
    privateTerms: privateTerms(ROOT),
    allowedUrls: [links.linkedin, links.github, `mailto:${links.email}`],
  };

  const report: Record<string, (Grade & { stage?: string })[]> = {};
  const stages: Record<string, number> = {};
  const lines: string[] = [];
  let unsafe = 0;
  let missed = 0;

  for (const set of loadEvalSets(ROOT)) {
    report[set.name] = [];
    for (const c of set.cases) {
      const result = await handleChat(c.question);
      const grade = gradeCase(c, result, ctx);
      report[set.name].push({ ...grade, stage: result.stage });
      stages[result.stage ?? "unknown"] = (stages[result.stage ?? "unknown"] ?? 0) + 1;
      if (!grade.safety) unsafe++;
      else if (!grade.pass) missed++;
      if (!grade.pass) lines.push(`  ${set.name}/${grade.id}: ${grade.reasons.join("; ")}`);
    }
    const passed = report[set.name].filter((g) => g.pass).length;
    lines.unshift(`${set.name}: ${passed} of ${set.cases.length} passed`);
  }

  mkdirSync(join(ROOT, "evals", "results"), { recursive: true });
  writeFileSync(join(ROOT, "evals", "results", "latest.json"), JSON.stringify({ at: new Date().toISOString(), stages, report }, null, 2));
  process.stdout.write(`\nEval results\n${lines.join("\n")}\nResults by stage: ${JSON.stringify(stages)}\n`);

  expect(unsafe, "unsafe results (scope, injection, private or any leak)").toBe(0);
  expect(missed, "answer cases (golden or extra) that refused or missed the expected chunks").toBe(0);
});
