// Decides what the ingest script must change in the database. Pure, so it is
// unit tested without a database or an API key.
import { createHash } from "node:crypto";
import type { Chunk } from "./chunk";

export const SCHEMA_DIMENSIONS = 1536; // db/schema.sql: vector(1536)

export type StoredChunk = { id: string; content_hash: string; model: string };

export type IngestPlan = {
  // New or changed chunks, or chunks embedded with a different model.
  toEmbed: Chunk[];
  // Rows whose id is no longer in the corpus (removed or now held back by [CONFIRM]).
  toDelete: string[];
  unchanged: number;
};

// The text that gets embedded: heading path plus chunk text.
export function embeddingInput(chunk: Chunk): string {
  return `${chunk.context}: ${chunk.text}`;
}

export function contentHash(chunk: Chunk): string {
  return createHash("sha256").update(`${chunk.source}\n${chunk.context}\n${chunk.text}`).digest("hex");
}

export function planIngest(current: readonly Chunk[], stored: readonly StoredChunk[], model: string): IngestPlan {
  const storedById = new Map(stored.map((s) => [s.id, s]));
  const currentIds = new Set(current.map((c) => c.id));

  const toEmbed = current.filter((c) => {
    const s = storedById.get(c.id);
    return !s || s.content_hash !== contentHash(c) || s.model !== model;
  });
  const toDelete = stored.filter((s) => !currentIds.has(s.id)).map((s) => s.id);

  return { toEmbed, toDelete, unchanged: current.length - toEmbed.length };
}
