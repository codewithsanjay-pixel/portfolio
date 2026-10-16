// Loads every corpus source through the allowlist. For scripts, tests and evals.
// The chat route uses lib/corpus/resume.ts instead: a fixed path, so the
// bundler traces one file rather than the whole project.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chunkResume, type Chunk } from "./chunk";
import { CORPUS_SOURCES, assertCorpusSource } from "./sources";

export function loadCorpusChunks(root = process.cwd()): Chunk[] {
  return CORPUS_SOURCES.flatMap((source) => {
    const path = assertCorpusSource(source);
    return chunkResume(readFileSync(join(root, path), "utf8"), path);
  });
}
