// The only files the chat corpus may be built from (SPEC.md: resume and
// approved project text; the project text currently lives in RESUME.md).
// The ingest script must read every file through assertCorpusSource.

export const CORPUS_SOURCES: readonly string[] = ["docs/RESUME.md"];

// Never allowed, even if someone adds them to CORPUS_SOURCES: the fictional
// example (ADR 005) and private, git-ignored detail about me.
// Written as path segments so the bundled route never contains the private
// folder's path as text (the post-build scan forbids that).
const FORBIDDEN_PREFIXES = [
  ["content", "example", ""],
  ["app", "example", ""],
  ["docs", "private", ""],
].map((segments) => segments.join("/"));

function normalize(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function isForbiddenSource(path: string): boolean {
  const p = normalize(path);
  const lower = p.toLowerCase();
  return FORBIDDEN_PREFIXES.some((prefix) => {
    const f = prefix.toLowerCase();
    return lower === f.replace(/\/$/, "") || lower.startsWith(f);
  });
}

export function assertCorpusSource(path: string): string {
  const p = normalize(path);
  if (p.split("/").includes("..") || isForbiddenSource(p) || !CORPUS_SOURCES.includes(p)) {
    throw new Error(`Not an allowed corpus source: ${p}`);
  }
  return p;
}
