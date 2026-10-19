// Wires the real providers into the chat flow. Used by the route and by `npm run eval`.
import { links } from "@/content/site";
import { loadResumeChunks } from "../corpus/resume";
import { contentHash } from "../corpus/ingest-plan";
import { readonlyDb } from "../db";
import { createEmbedder } from "../embed";
import { intEnv, type Env } from "../env";
import { createAnswerModel } from "../llm";
import { retrieve } from "../retrieve";
import { answerQuestion, type ChatDeps } from "./answer";
import type { ChatHandler } from "./types";

let deps: ChatDeps | null = null;

function scoreEnv(name: string, fallback: number, env: Env): number {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error(`Environment variable ${name} must be between 0 and 1.`);
  return n;
}

export function privateTermsFrom(env: Env): string[] {
  const terms = (env.PRIVATE_TERMS ?? "").split("|").map((t) => t.trim()).filter(Boolean);
  // The guard must never be silently off on any Vercel deployment (previews included)
  // or any production server.
  if (terms.length === 0 && (env.VERCEL_ENV || env.NODE_ENV === "production")) {
    throw new Error("Missing environment variable PRIVATE_TERMS. See .env.example.");
  }
  return terms;
}

function buildDeps(env: Env = process.env): ChatDeps {
  // Current corpus: id -> content hash. Rows outside it are never shown to the model.
  const allowed = new Map(loadResumeChunks().map((c) => [c.id, contentHash(c)]));
  const db = readonlyDb(env);
  const embedder = createEmbedder(env);
  const k = intEnv("RETRIEVAL_TOP_K", 5, env);
  return {
    retrieve: (question) => retrieve(question, { db, embedder, k, allowed }),
    model: createAnswerModel(env),
    minScore: scoreEnv("SCOPE_MIN_SCORE", 0.25, env),
    allowedUrls: [links.linkedin, links.github, `mailto:${links.email}`],
    // "|"-separated, set only in .env.local and Vercel; the words never enter the repo.
    privateTerms: privateTermsFrom(env),
  };
}

export const handleChat: ChatHandler = async (question) => {
  deps ??= buildDeps();
  return answerQuestion(question, deps);
};

let labels: Map<string, string> | null = null;

// Visitor-facing label: the last part of the heading path, e.g. "Retrieval (American
// Airlines)" rather than "Detail from me > Retrieval (American Airlines)" (CONTENT.md).
export function citationLabel(context: string): string {
  const parts = context.split(" > ");
  return parts[parts.length - 1].split(":")[0].trim();
}

// Citations shown to visitors: the chunk id plus its section, never raw retrieved text.
export function describeCitations(ids: readonly string[]): { id: string; section: string }[] {
  labels ??= new Map(loadResumeChunks().map((c) => [c.id, citationLabel(c.context)]));
  return ids.filter((id) => labels!.has(id)).map((id) => ({ id, section: labels!.get(id)! }));
}

// Retrieval rows for the public trace: section heading and score, never ids or text.
export function describeRetrieval(items: { id: string; score: number }[], cited: readonly string[]) {
  labels ??= new Map(loadResumeChunks().map((c) => [c.id, citationLabel(c.context)]));
  return items
    .filter((x) => labels!.has(x.id))
    .map((x) => ({ section: labels!.get(x.id)!, score: x.score, cited: cited.includes(x.id) }));
}
