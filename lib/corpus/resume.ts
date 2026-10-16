// Runtime corpus for the chat route. The path is a literal so the bundler ships
// exactly docs/RESUME.md with the route (next.config.ts outputFileTracingIncludes)
// and nothing else from the repo.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chunkResume, type Chunk } from "./chunk";
import { assertCorpusSource } from "./sources";

const RESUME = assertCorpusSource("docs/RESUME.md");

export function loadResumeChunks(): Chunk[] {
  return chunkResume(readFileSync(join(process.cwd(), "docs", "RESUME.md"), "utf8"), RESUME);
}
