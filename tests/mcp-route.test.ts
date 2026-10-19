/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON-RPC replies and mocks in tests */
// The MCP route: rate limit first, strict input, JSON-RPC protocol, guards, no ids.
import { beforeEach, describe, expect, it, vi } from "vitest";

const check = vi.fn();
const retrieve = vi.fn();
let failCreate = false;
let privateTerms: string[] = ["acmeinternal"];

vi.mock("@/lib/ratelimit", async (orig) => ({
  ...(await orig<typeof import("@/lib/ratelimit")>()),
  createRateLimiter: () => {
    if (failCreate) throw new Error("Missing environment variable UPSTASH_REDIS_REST_URL. See .env.example.");
    return { check };
  },
}));
vi.mock("@/lib/chat/handler", async (orig) => ({
  ...(await orig<typeof import("@/lib/chat/handler")>()),
  getChatDeps: () => ({
    retrieve: (q: string) => retrieve(q),
    model: { answer: () => Promise.reject(new Error("the MCP server never calls the model")) },
    minScore: 0.25,
    allowedUrls: ["https://www.linkedin.com/in/example", "https://github.com/example"],
    privateTerms,
  }),
}));

const { POST, GET, DELETE } = await import("@/app/api/mcp/route");

function req(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/mcp", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7", ...headers },
  });
}
const rpc = (method: string, params?: unknown, id: number | string = 1) => JSON.stringify({ jsonrpc: "2.0", id, method, params });
const call = (name: string, args?: unknown) => rpc("tools/call", { name, arguments: args });

async function json(res: Response) {
  return (await res.json()) as any;
}

const chunk = (id: string, text: string, score: number, context = "Experience > Engineer. Somewhere") => ({ id, source: "docs/RESUME.md", context, text, score });

beforeEach(() => {
  vi.stubEnv("VERCEL", "1");
  failCreate = false;
  privateTerms = ["acmeinternal"];
  check.mockReset().mockResolvedValue({ ok: true });
  retrieve.mockReset().mockResolvedValue([chunk("aa-rag-pipelines", "Built RAG pipelines with pgvector.", 0.61)]);
});

describe("protocol", () => {
  it("initializes with name, version and tools capability", async () => {
    const res = await POST(req(rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } })));
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.id).toBe(1);
    expect(body.result.protocolVersion).toBe("2025-06-18");
    expect(body.result.capabilities).toEqual({ tools: {} });
    expect(body.result.serverInfo.name).toBeTruthy();
    expect(body.result.serverInfo.version).toBeTruthy();
  });

  it("answers an unknown protocol version with its own", async () => {
    const body = await json(await POST(req(rpc("initialize", { protocolVersion: "1999-01-01" }))));
    expect(body.result.protocolVersion).toBe("2025-06-18");
  });

  it("accepts the initialized notification with 202 and no body", async () => {
    const res = await POST(req(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })));
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("answers ping", async () => {
    expect((await json(await POST(req(rpc("ping"))))).result).toEqual({});
  });

  it("lists three tools with strict schemas", async () => {
    const body = await json(await POST(req(rpc("tools/list"))));
    const tools = body.result.tools;
    expect(tools.map((t: any) => t.name)).toEqual(["search_resume", "get_section", "list_evals"]);
    for (const t of tools) {
      expect(t.description.length).toBeGreaterThan(40);
      expect(t.inputSchema.additionalProperties).toBe(false);
      expect(t.outputSchema.type).toBe("object");
    }
    expect(tools[1].inputSchema.properties.section.enum).toContain("Summary");
  });

  it("calls search_resume: section, text and a one-decimal score, no ids", async () => {
    retrieve.mockResolvedValue([chunk("aa-rag-pipelines", "Built RAG pipelines with pgvector.", 0.6149)]);
    const res = await POST(req(call("search_resume", { query: "RAG" })));
    const body = await json(res);
    expect(body.result.isError).toBe(false);
    expect(body.result.structuredContent.passages).toEqual([{ section: "Engineer. Somewhere", text: "Built RAG pipelines with pgvector.", score: 0.6 }]);
    expect(JSON.stringify(body)).not.toContain("aa-rag-pipelines");
    expect(JSON.parse(body.result.content[0].text)).toEqual(body.result.structuredContent);
    expect(retrieve).toHaveBeenCalledWith("RAG");
  });

  it("drops passages below the chat's scope score", async () => {
    retrieve.mockResolvedValue([chunk("a", "Built RAG pipelines.", 0.1)]);
    const body = await json(await POST(req(call("search_resume", { query: "weather" }))));
    expect(body.result.structuredContent.passages).toEqual([]);
  });

  it("calls get_section from the real resume text, without ids", async () => {
    const body = await json(await POST(req(call("get_section", { section: "Summary" }))));
    expect(body.result.isError).toBe(false);
    expect(body.result.structuredContent.section).toBe("Summary");
    expect(body.result.structuredContent.text.length).toBeGreaterThan(50);
    expect(JSON.stringify(body)).not.toMatch(/summary-[a-z0-9]+-[a-z0-9]+/);
  });

  it("lists the public eval sets with counts", async () => {
    const body = await json(await POST(req(call("list_evals", {}))));
    const sets = body.result.structuredContent.sets;
    expect(sets.map((s: any) => s.name)).toEqual(["Golden", "Scope", "Injection", "Extra"]);
    expect(sets.every((s: any) => Number.isInteger(s.cases) && s.cases > 0)).toBe(true);
    expect(sets.map((s: any) => s.name.toLowerCase())).not.toContain("private");
  });

  it("rejects bad JSON with -32700", async () => {
    const res = await POST(req("{nope"));
    expect(res.status).toBe(400);
    expect((await json(res)).error.code).toBe(-32700);
  });

  it("rejects batches, non-objects and wrong envelopes with -32600", async () => {
    for (const raw of ["[]", JSON.stringify([{ jsonrpc: "2.0", id: 1, method: "ping" }]), "42", JSON.stringify({ id: 1, method: "ping" }), JSON.stringify({ jsonrpc: "2.0", id: {}, method: "ping" }), JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping", params: [] })]) {
      const res = await POST(req(raw));
      expect(res.status).toBe(400);
      expect((await json(res)).error.code).toBe(-32600);
    }
  });

  it("returns -32601 for an unknown method", async () => {
    const body = await json(await POST(req(rpc("resources/list"))));
    expect(body.error.code).toBe(-32601);
    expect(body.id).toBe(1);
  });

  it("returns -32602 for an unknown tool", async () => {
    const body = await json(await POST(req(call("delete_everything", {}))));
    expect(body.error.code).toBe(-32602);
  });

  it("returns -32602 for schema violations", async () => {
    const bad: [string, unknown][] = [
      ["search_resume", {}],
      ["search_resume", { query: "" }],
      ["search_resume", { query: "x".repeat(201) }],
      ["search_resume", { query: 5 }],
      ["search_resume", { query: "ok", extra: true }],
      ["search_resume", "text"],
      ["get_section", { section: "Not a section" }],
      ["list_evals", { anything: 1 }],
    ];
    for (const [name, args] of bad) {
      const body = await json(await POST(req(call(name, args))));
      expect(body.error?.code, `${name} ${JSON.stringify(args)}`).toBe(-32602);
    }
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("returns -32602 for missing tool params", async () => {
    expect((await json(await POST(req(rpc("tools/call", {}))))).error.code).toBe(-32602);
  });

  it("answers a failing retrieval with a generic tool error", async () => {
    retrieve.mockRejectedValue(new Error("connection to postgres://user:secret@host failed"));
    const res = await POST(req(call("search_resume", { query: "RAG" })));
    const text = await res.text();
    expect(text).not.toMatch(/postgres|secret|host/);
    expect(JSON.parse(text).result.isError).toBe(true);
  });
});

describe("guards", () => {
  it("drops a passage with a private term, silently", async () => {
    retrieve.mockResolvedValue([chunk("a", "Worked on AcmeInternal tooling.", 0.9), chunk("b", "Built RAG pipelines.", 0.8)]);
    const text = await (await POST(req(call("search_resume", { query: "tooling" })))).text();
    expect(text).not.toMatch(/acmeinternal/i);
    expect(JSON.parse(text).result.structuredContent.passages.map((p: any) => p.text)).toEqual(["Built RAG pipelines."]);
    expect(text).not.toMatch(/dropped|filtered|guard|private/i);
  });

  it("drops a passage with a disallowed link", async () => {
    retrieve.mockResolvedValue([chunk("a", "See https://evil.example.com/x for details.", 0.9), chunk("b", "Built RAG pipelines.", 0.8)]);
    const body = await json(await POST(req(call("search_resume", { query: "details" }))));
    expect(body.result.structuredContent.passages).toHaveLength(1);
  });

  it("drops a passage with markup or an unexpected character", async () => {
    retrieve.mockResolvedValue([chunk("a", "<script>alert(1)</script>", 0.9), chunk("b", "Привет RAG", 0.8)]);
    const body = await json(await POST(req(call("search_resume", { query: "details" }))));
    expect(body.result.structuredContent.passages).toEqual([]);
  });

  it("applies the private-term list to get_section", async () => {
    privateTerms = ["python"];
    const body = await json(await POST(req(call("get_section", { section: "Technical skills" }))));
    expect(JSON.stringify(body)).not.toMatch(/python/i);
  });
});

describe("limits and input", () => {
  it("rate limits before anything else, for every method", async () => {
    check.mockResolvedValue({ ok: false, reason: "minute" });
    for (const raw of [rpc("tools/list"), rpc("initialize", {}), "{nope", call("search_resume", { query: "RAG" })]) {
      const res = await POST(req(raw));
      expect(res.status).toBe(429);
    }
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("checks the limiter once per request", async () => {
    await POST(req(call("search_resume", { query: "RAG" })));
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("fails closed when the limiter is unavailable or not configured", async () => {
    check.mockResolvedValue({ ok: false, reason: "unavailable" });
    expect((await POST(req(rpc("ping")))).status).toBe(503);
    failCreate = true;
    // limiter is cached after the first successful creation in this module, so re-import fresh
    vi.resetModules();
    const fresh = await import("@/app/api/mcp/route");
    const res = await fresh.POST(req(rpc("ping")));
    expect(res.status).toBe(503);
    expect(await res.text()).not.toMatch(/UPSTASH/);
  });

  it("requires application/json", async () => {
    expect((await POST(req(rpc("ping"), { "content-type": "text/plain" }))).status).toBe(415);
  });

  it("refuses an oversize body, declared or streamed", async () => {
    const big = rpc("ping", { pad: "x".repeat(5000) });
    expect((await POST(req(big))).status).toBe(413);
    expect((await POST(req(big, { "content-length": "5000" }))).status).toBe(413);
  });

  it("refuses any request that carries an Origin header (browsers only)", async () => {
    expect((await POST(req(rpc("ping"), { origin: "https://evil.example", host: "localhost" }))).status).toBe(403);
    expect((await POST(req(rpc("ping"), { origin: "http://localhost", host: "localhost" }))).status).toBe(403);
  });

  it("refuses GET and DELETE with 405", async () => {
    for (const fn of [GET, DELETE]) {
      const res = fn();
      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toBe("POST");
    }
  });
});
