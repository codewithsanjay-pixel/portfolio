// Retrieval for the chat (SPEC.md flow step 3): embed the question, return the
// top-k chunks from pgvector. Runs on the read-only database role.
import type { Db } from "./db";
import { toVectorLiteral, type Embedder } from "./embed";

export type RetrievedChunk = { id: string; source: string; context: string; text: string; score: number };

export type RetrieveOptions = {
  db: Db;
  embedder: Embedder;
  k: number;
  // Current corpus: chunk id -> content hash (lib/corpus/ingest-plan.ts). A row whose
  // id is unknown, or whose text changed since the last ingest, is dropped and never
  // shown to the model.
  allowed: ReadonlyMap<string, string>;
};

export const MAX_TOP_K = 20;

export const RETRIEVE_SQL =
  "SELECT id, source, context, text, content_hash, 1 - (embedding <=> $1::vector) AS score " +
  "FROM chunks ORDER BY embedding <=> $1::vector LIMIT $2";

export async function retrieve(question: string, { db, embedder, k, allowed }: RetrieveOptions): Promise<RetrievedChunk[]> {
  const limit = Math.min(Math.max(1, Math.floor(k)), MAX_TOP_K);
  const [vector] = await embedder.embed([question]);
  const rows = await db.query(RETRIEVE_SQL, [toVectorLiteral(vector), limit]);
  return rows
    .filter((r) => allowed.get(String(r.id)) === String(r.content_hash))
    .map((r) => ({
      id: String(r.id),
      source: String(r.source),
      context: String(r.context),
      text: String(r.text),
      score: Number(r.score),
    }));
}
