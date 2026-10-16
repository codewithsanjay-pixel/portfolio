import { describe, expect, it, vi } from "vitest";
import { ANSWER_SCHEMA, createAnswerModel } from "@/lib/llm";

const ENV = { OPENAI_API_KEY: "sk-test-secret", LLM_MODEL: "answer-model" };
const input = { system: "SYSTEM", question: "Where do you work?", sources: [{ id: "aa-role", context: "Experience", text: "Backend Engineer" }] };

function reply(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

const ok = (payload: unknown) =>
  reply({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(payload) }] }] });

describe("createAnswerModel", () => {
  it("sends the documented Responses API shape", async () => {
    const fetchImpl = ok({ refused: false, answer: "At American Airlines.", citations: ["aa-role"] });
    await createAnswerModel(ENV, fetchImpl).answer(input);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("answer-model");
    expect(body.input[0]).toEqual({ role: "system", content: "SYSTEM" });
    expect(body.input[1].role).toBe("user");
    expect(JSON.parse(body.input[1].content)).toEqual({
      question: "Where do you work?",
      sources: [{ id: "aa-role", section: "Experience", text: "Backend Engineer" }],
    });
    expect(body.text.format).toEqual({ type: "json_schema", name: "cited_answer", schema: ANSWER_SCHEMA, strict: true });
    expect(body.store).toBe(false);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("parses a structured answer", async () => {
    const out = await createAnswerModel(ENV, ok({ refused: false, answer: "Hi", citations: ["aa-role"] })).answer(input);
    expect(out).toEqual({ refused: false, answer: "Hi", citations: ["aa-role"] });
  });

  it("treats a provider refusal as a refusal", async () => {
    const fetchImpl = reply({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }] });
    expect((await createAnswerModel(ENV, fetchImpl).answer(input)).refused).toBe(true);
  });

  it.each([
    ["an HTTP error", reply({ error: { message: "echo sk-test-secret" } }, 401), /status 401/],
    ["an incomplete answer", reply({ status: "incomplete", output: [] }), /not completed/],
    ["text that is not JSON", reply({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "oops" }] }] }), /schema/],
    ["the wrong shape", ok({ refused: "no", answer: 1, citations: "x" }), /schema/],
    ["no message", reply({ status: "completed", output: [] }), /no message/],
  ])("fails safely on %s without leaking the key", async (_label, fetchImpl, pattern) => {
    const err = (await createAnswerModel(ENV, fetchImpl).answer(input).then(() => null, (e: Error) => e)) as Error;
    expect(err.message).toMatch(pattern);
    expect(err.message).not.toContain("sk-test");
  });

  it("rejects an unknown reasoning effort", () => {
    expect(() => createAnswerModel({ ...ENV, LLM_REASONING_EFFORT: "turbo" })).toThrow(/LLM_REASONING_EFFORT/);
  });
});
