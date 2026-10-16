// Embedding provider interface (SPEC.md: one embedding provider behind a small
// interface). OpenAI is the only implementation (ADR 007). No provider types
// leave this file; swap providers by adding an implementation here.
import { intEnv, requireEnv, type Env } from "./env";

export type Embedder = {
  model: string;
  dimensions: number;
  // One vector per input text, in the same order.
  embed(texts: readonly string[]): Promise<number[][]>;
};

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
// The embeddings endpoint accepts a list of inputs; keep batches modest.
const BATCH_SIZE = 64;

export function createEmbedder(env: Env = process.env, fetchImpl: FetchLike = fetch, timeoutMs = 10_000): Embedder {
  const apiKey = requireEnv("OPENAI_API_KEY", env);
  const model = requireEnv("EMBEDDING_MODEL", env);
  const dimensions = intEnv("EMBEDDING_DIMENSIONS", 1536, env);

  async function embedBatch(input: readonly string[]): Promise<number[][]> {
    let res: Response;
    try {
      res = await fetchImpl(OPENAI_EMBEDDINGS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, input, dimensions, encoding_format: "float" }),
        // A fresh timeout per call, so a stalled provider cannot hold a request open.
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new Error("Embedding request did not complete (timeout or network error).");
    }
    if (!res.ok) {
      // Status only: provider error bodies can echo input text.
      throw new Error(`Embedding request failed with status ${res.status}.`);
    }
    let body: { data?: { index: number; embedding: number[] }[] };
    try {
      body = (await res.json()) as typeof body;
    } catch {
      throw new Error("Embedding response was not valid JSON.");
    }
    const data = [...(body.data ?? [])].sort((a, b) => a.index - b.index);
    if (data.length !== input.length || data.some((d) => d.embedding.length !== dimensions)) {
      throw new Error("Embedding response did not match the request.");
    }
    return data.map((d) => d.embedding);
  }

  return {
    model,
    dimensions,
    async embed(texts) {
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        out.push(...(await embedBatch(texts.slice(i, i + BATCH_SIZE))));
      }
      return out;
    },
  };
}

// pgvector accepts a vector as the text '[0.1,0.2,...]'. Sent as a query parameter, never spliced into SQL.
export function toVectorLiteral(vector: readonly number[]): string {
  if (vector.some((x) => !Number.isFinite(x))) throw new Error("Vector contains a non-finite number.");
  return `[${vector.join(",")}]`;
}
