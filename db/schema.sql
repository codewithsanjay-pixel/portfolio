-- Applied by `npm run ingest` with the owner role. Safe to run repeatedly.
-- The read-only role and its grants are in docs/DB.md (run once by hand).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chunks (
  id            text PRIMARY KEY,           -- stable id from lib/corpus/chunk.ts
  source        text NOT NULL,              -- always docs/RESUME.md today
  context       text NOT NULL,              -- heading path, e.g. "Experience > ..."
  text          text NOT NULL,
  content_hash  text NOT NULL,              -- sha256 of context + text, to skip unchanged chunks
  model         text NOT NULL,              -- embedding model that produced the vector
  embedding     vector(1536) NOT NULL,      -- must match EMBEDDING_DIMENSIONS
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);
