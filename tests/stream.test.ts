// Typed chat events: encoding, strict parsing, incremental reading, size caps.
import { describe, expect, it, vi } from "vitest";
import { answerQuestion, type ChatDeps } from "@/lib/chat/answer";
import { createSseReader, encodeEvent, MAX_EVENT_BYTES, parseChatEvent } from "@/lib/chat/stream";
import type { RetrievedChunk } from "@/lib/retrieve";

describe("encodeEvent and parseChatEvent", () => {
  it("round-trips a versioned stage event", () => {
    const text = encodeEvent("stage", { key: "retrieve", ms: 80 });
    expect(text).toBe('event: stage\ndata: {"v":1,"key":"retrieve","ms":80}\n\n');
    const [raw] = createSseReader().feed(text);
    expect(parseChatEvent(raw.event, raw.data)).toEqual({ type: "stage", key: "retrieve", ms: 80 });
  });

  it("parses final without the version field, and error", () => {
    expect(parseChatEvent("final", '{"v":1,"refused":false,"answer":"a","citations":[],"trace":null}')).toEqual({
      type: "final",
      body: { refused: false, answer: "a", citations: [], trace: null },
    });
    expect(parseChatEvent("error", '{"v":1,"message":"Nope."}')).toEqual({ type: "error", message: "Nope." });
  });

  it.each([
    ["unknown event", "ping", '{"v":1}'],
    ["unknown step key", "stage", '{"v":1,"key":"secret"}'],
    ["wrong version", "stage", '{"v":2,"key":"rate"}'],
    ["missing version", "stage", '{"key":"rate"}'],
    ["not JSON", "stage", "rate"],
    ["an array", "final", "[]"],
    ["non-string message", "error", '{"v":1,"message":5}'],
    ["a huge event", "final", `{"v":1,"answer":"${"x".repeat(MAX_EVENT_BYTES)}"}`],
  ])("ignores %s", (_l, name, data) => {
    expect(parseChatEvent(name, data)).toBeNull();
  });

  it("drops a bad ms but keeps the stage", () => {
    expect(parseChatEvent("stage", '{"v":1,"key":"model","ms":"fast"}')).toEqual({ type: "stage", key: "model" });
  });
});

describe("createSseReader", () => {
  it("handles events split across chunks, CRLF and comments", () => {
    const r = createSseReader();
    expect(r.feed("event: stage\nda")).toEqual([]);
    expect(r.feed('ta: {"v":1}\n\n: keep-alive\n\nevent: error\r')).toEqual([{ event: "stage", data: '{"v":1}' }]);
    expect(r.feed('\ndata: {"v":1}\r\n\r\n')).toEqual([{ event: "error", data: '{"v":1}' }]);
  });

  it("throws on an oversized event or stream", () => {
    expect(() => createSseReader().feed("data: " + "x".repeat(MAX_EVENT_BYTES + 1))).toThrow();
    const r = createSseReader();
    expect(() => {
      for (let i = 0; i < 1000; i++) r.feed(`data: ${"x".repeat(90)}\n\n`);
    }).toThrow();
  });
});

describe("answerQuestion onStep", () => {
  const chunk = (score: number): RetrievedChunk => ({ id: "aa", source: "docs/RESUME.md", context: "Experience", text: "Backend Engineer at American Airlines.", score });
  const deps = (c: RetrievedChunk[], answer: string, citations = ["aa"]): ChatDeps => ({
    retrieve: async () => c,
    model: { answer: vi.fn(async () => ({ refused: false, answer, citations })) },
    minScore: 0.3,
    allowedUrls: [],
  });

  it("reports each step that passes, in order, with checks last", async () => {
    const seen: string[] = [];
    await answerQuestion("Where do you work?", deps([chunk(0.6)], "I work at American Airlines."), (k) => seen.push(k));
    expect(seen).toEqual(["input", "retrieve", "scope", "model", "checks"]);
  });

  it("never reports a step that stopped, and never reports checks after a failed check", async () => {
    const seen: string[] = [];
    await answerQuestion("q", deps([chunk(0.1)], "x"), (k) => seen.push(k));
    expect(seen).toEqual(["input", "retrieve"]);
    seen.length = 0;
    await answerQuestion("q", deps([chunk(0.6)], "I led 40 engineers.", ["aa"]), (k) => seen.push(k));
    expect(seen).toEqual(["input", "retrieve", "scope", "model"]);
  });

  it("is not affected by a callback that throws", async () => {
    const r = await answerQuestion("q", deps([chunk(0.6)], "I work at American Airlines."), () => {
      throw new Error("closed");
    });
    expect(r.refused).toBe(false);
  });
});
