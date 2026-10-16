// Provider and retrieval code, tested with a fake fetch and a fake database.
import { describe, expect, it, vi } from "vitest";
import { contentHash, planIngest } from "@/lib/corpus/ingest-plan";
import type { Chunk } from "@/lib/corpus/chunk";
import { ownerDb, readonlyDb, type Db } from "@/lib/db";
import { createEmbedder, toVectorLiteral } from "@/lib/embed";
import { requireEnv } from "@/lib/env";
import { MAX_TOP_K, RETRIEVE_SQL, retrieve } from "@/lib/retrieve";

const ENV = { OPENAI_API_KEY: "sk-test-secret", EMBEDDING_MODEL: "embed-model", EMBEDDING_DIMENSIONS: "3" };

function fakeFetch(vectors: number[][], status = 200) {
  return vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { input: string[] };
    return new Response(
      JSON.stringify({ data: body.input.map((_, i) => ({ index: i, embedding: vectors[i % vectors.length] })) }),
      { status },
    );
  });
}

describe("createEmbedder", () => {
  it("sends the documented request shape with the model and size from env", async () => {
    const fetchImpl = fakeFetch([[0.1, 0.2, 0.3]]);
    const vectors = await createEmbedder(ENV, fetchImpl).embed(["hello"]);
    expect(vectors).toEqual([[0.1, 0.2, 0.3]]);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/embeddings");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test-secret");
    expect(JSON.parse(String(init.body))).toEqual({ model: "embed-model", input: ["hello"], dimensions: 3, encoding_format: "float" });
  });

  it("batches large inputs and keeps order", async () => {
    const fetchImpl = fakeFetch([[1, 0, 0]]);
    const out = await createEmbedder(ENV, fetchImpl).embed(Array.from({ length: 130 }, (_, i) => `t${i}`));
    expect(out).toHaveLength(130);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("fails without leaking the key or response body", async () => {
    const fetchImpl = vi.fn(async () => new Response("echo of secret input", { status: 401 }));
    const err = (await createEmbedder(ENV, fetchImpl)
      .embed(["secret input"])
      .then(() => null, (e: Error) => e)) as Error;
    expect(err.message).toBe("Embedding request failed with status 401.");
    expect(err.message).not.toContain("sk-test");
    expect(err.message).not.toContain("secret input");
  });

  it("rejects a response with the wrong vector size", async () => {
    await expect(createEmbedder(ENV, fakeFetch([[1, 2]])).embed(["x"])).rejects.toThrow(/did not match/);
  });

  it("names missing variables without printing values", () => {
    expect(() => createEmbedder({ ...ENV, OPENAI_API_KEY: "" })).toThrow("Missing environment variable OPENAI_API_KEY");
    expect(() => requireEnv("NOPE", {})).toThrow(/NOPE/);
  });
});

describe("toVectorLiteral", () => {
  it("formats pgvector text and rejects bad numbers", () => {
    expect(toVectorLiteral([0.5, -1, 2])).toBe("[0.5,-1,2]");
    expect(() => toVectorLiteral([1, Number.NaN])).toThrow();
  });
});

describe("planIngest", () => {
  const chunk = (id: string, text: string): Chunk => ({ id, source: "docs/RESUME.md", context: "Summary", text });

  it("embeds new and changed chunks, deletes removed ones, skips unchanged", () => {
    const keep = chunk("keep", "same text");
    const changed = chunk("changed", "new text");
    const added = chunk("added", "brand new");
    const stored = [
      { id: "keep", content_hash: contentHash(keep), model: "m" },
      { id: "changed", content_hash: "old-hash", model: "m" },
      { id: "removed", content_hash: "x", model: "m" },
    ];
    const plan = planIngest([keep, changed, added], stored, "m");
    expect(plan.toEmbed.map((c) => c.id).sort()).toEqual(["added", "changed"]);
    expect(plan.toDelete).toEqual(["removed"]);
    expect(plan.unchanged).toBe(1);
  });

  it("re-embeds everything when the model changes", () => {
    const c = chunk("a", "text");
    expect(planIngest([c], [{ id: "a", content_hash: contentHash(c), model: "old" }], "new").toEmbed).toHaveLength(1);
  });
});

describe("retrieve", () => {
  const embedder = { model: "m", dimensions: 3, embed: async () => [[0.1, 0.2, 0.3]] };
  const row = (id: string, hash: string, text = "t") => ({ id, source: "s", context: "c", text, content_hash: hash, score: 0.9 });

  it("uses a parameterized query and never puts the question in SQL", async () => {
    const query = vi.fn<Db["query"]>(async () => [row("aa-role", "h1")]);
    const db: Db = { query, transaction: async () => {} };
    const question = "'; DROP TABLE chunks; --";
    const out = await retrieve(question, { db, embedder, k: 5, allowed: new Map([["aa-role", "h1"]]) });
    expect(out.map((r) => r.id)).toEqual(["aa-role"]);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toBe(RETRIEVE_SQL);
    expect(sql).not.toContain(question);
    expect(params).toEqual(["[0.1,0.2,0.3]", 5]);
  });

  it("drops unknown rows and rows whose text changed since the last ingest", async () => {
    const db: Db = {
      query: async () => [row("aa-role", "h1"), row("stale-held-back-row", "x", "old text"), row("edited", "old-hash", "old wording")],
      transaction: async () => {},
    };
    const allowed = new Map([
      ["aa-role", "h1"],
      ["edited", "new-hash"],
    ]);
    const out = await retrieve("q", { db, embedder, k: 5, allowed });
    expect(out.map((r) => r.id)).toEqual(["aa-role"]);
  });

  it("caps top-k", async () => {
    const query = vi.fn<Db["query"]>(async () => []);
    await retrieve("q", { db: { query, transaction: async () => {} }, embedder, k: 500, allowed: new Map() });
    expect(query.mock.calls[0][1]?.[1]).toBe(MAX_TOP_K);
  });
});

describe("timeouts and bad responses", () => {
  it("reports a timeout without details", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    await expect(createEmbedder(ENV, fetchImpl).embed(["x"])).rejects.toThrow("Embedding request did not complete (timeout or network error).");
  });

  it("reports invalid JSON without quoting the body", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>secret page</html>", { status: 200 }));
    const err = (await createEmbedder(ENV, fetchImpl)
      .embed(["x"])
      .then(() => null, (e: Error) => e)) as Error;
    expect(err.message).toBe("Embedding response was not valid JSON.");
  });

  it("passes an abort signal on every call", async () => {
    const fetchImpl = fakeFetch([[1, 2, 3]]);
    await createEmbedder(ENV, fetchImpl).embed(["x"]);
    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe("database connection strings", () => {
  it("rejects a malformed URL without echoing it", () => {
    const secretish = "psql 'postgresql://owner:sup3rS3cret@host/neondb'";
    const err = (() => {
      try {
        ownerDb({ DATABASE_URL: secretish });
        return null;
      } catch (e) {
        return e as Error;
      }
    })();
    expect(err?.message).toMatch(/DATABASE_URL is not a valid postgres:\/\/ connection string/);
    expect(err?.message).not.toContain("sup3rS3cret");
  });

  it("accepts a postgres URL without connecting", () => {
    expect(() => readonlyDb({ DATABASE_URL_READONLY: "postgresql://chat_reader:pw@host.example/neondb?sslmode=require" })).not.toThrow();
  });
});
