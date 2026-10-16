// npm run ingest: chunk docs/RESUME.md, embed new or changed chunks, and sync
// the chunks table. Uses the owner role (DATABASE_URL). Prints counts and ids
// only, never keys or connection strings.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCorpusChunks } from "@/lib/corpus/load";
import { SCHEMA_DIMENSIONS, contentHash, embeddingInput, planIngest, type StoredChunk } from "@/lib/corpus/ingest-plan";
import { ownerDb, type Statement } from "@/lib/db";
import { createEmbedder, toVectorLiteral } from "@/lib/embed";
import { loadLocalEnv } from "./load-env";

async function main() {
  loadLocalEnv();
  const root = process.cwd();
  const db = ownerDb();
  const embedder = createEmbedder();
  if (embedder.dimensions !== SCHEMA_DIMENSIONS) {
    throw new Error(`EMBEDDING_DIMENSIONS is ${embedder.dimensions}, but db/schema.sql uses ${SCHEMA_DIMENSIONS}.`);
  }

  // Schema first (idempotent).
  const schema = readFileSync(join(root, "db", "schema.sql"), "utf8")
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
  for (const statement of schema) await db.query(statement);

  // Chunks come only through the corpus allowlist (lib/corpus/sources.ts).
  const chunks = loadCorpusChunks(root);
  const stored = (await db.query("SELECT id, content_hash, model FROM chunks")) as StoredChunk[];
  const plan = planIngest(chunks, stored, embedder.model);

  // Remove rows no longer in the corpus first, so a held-back line is gone even if embedding fails later.
  if (plan.toDelete.length > 0) {
    await db.query("DELETE FROM chunks WHERE id = ANY($1::text[])", [plan.toDelete]);
  }

  const vectors = plan.toEmbed.length > 0 ? await embedder.embed(plan.toEmbed.map(embeddingInput)) : [];
  const statements: Statement[] = plan.toEmbed.map((chunk, i) => ({
    text:
      "INSERT INTO chunks (id, source, context, text, content_hash, model, embedding, updated_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7::vector, now()) " +
      "ON CONFLICT (id) DO UPDATE SET source = $2, context = $3, text = $4, content_hash = $5, " +
      "model = $6, embedding = $7::vector, updated_at = now()",
    params: [chunk.id, chunk.source, chunk.context, chunk.text, contentHash(chunk), embedder.model, toVectorLiteral(vectors[i])],
  }));
  if (statements.length > 0) await db.transaction(statements);

  const [{ count }] = (await db.query("SELECT count(*)::int AS count FROM chunks")) as { count: number }[];
  console.log(
    `Ingest done. Embedded ${plan.toEmbed.length}, unchanged ${plan.unchanged}, removed ${plan.toDelete.length}. ` +
      `Rows now: ${count} (corpus has ${chunks.length}).`,
  );
  if (plan.toDelete.length > 0) console.log(`Removed ids: ${plan.toDelete.join(", ")}`);
  if (count !== chunks.length) throw new Error("Row count does not match the corpus.");
}

main().catch((err: unknown) => {
  console.error(`Ingest failed: ${err instanceof Error ? err.message : "unknown error"}`);
  process.exit(1);
});
