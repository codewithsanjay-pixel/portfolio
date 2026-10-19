// The public trace must never reveal which post-model check refused (see lib/chat/trace.ts).
import { describe, expect, it } from "vitest";
import { buildTrace } from "@/lib/chat/trace";
import type { ChatResult, ChatStage } from "@/lib/chat/types";

const describe_ = (items: { id: string; score: number }[], cited: readonly string[]) =>
  items.map((x) => ({ section: x.id, score: x.score, cited: cited.includes(x.id) }));

function result(stage: ChatStage): ChatResult {
  return { refused: stage !== "answered", answer: "", citations: [], retrieved: [], stage, trace: { retrieved: [{ id: "a", score: 0.5 }], retrieveMs: 10, modelMs: 20 } };
}

const statuses = (stage: ChatStage) => buildTrace(result(stage), describe_, 100).steps.map((s) => `${s.key}:${s.status}`).join(" ");

describe("public trace", () => {
  it("passes every step for an answer", () => {
    expect(statuses("answered")).toBe("rate:pass input:pass retrieve:pass scope:pass model:pass checks:pass");
  });
  it("stops at input and scope", () => {
    expect(statuses("input")).toBe("rate:pass input:stop retrieve:skipped scope:skipped model:skipped checks:skipped");
    expect(statuses("scope")).toBe("rate:pass input:pass retrieve:pass scope:stop model:skipped checks:skipped");
  });
  it("looks the same for every refusal after the model", () => {
    const same = statuses("citations");
    for (const stage of ["guard", "private", "grounding"] as ChatStage[]) expect(statuses(stage)).toBe(same);
    expect(same).toBe("rate:pass input:pass retrieve:pass scope:pass model:pass checks:stop");
  });
  it("reports timings only for steps that ran", () => {
    const steps = buildTrace(result("scope"), describe_, 100).steps;
    expect(steps.find((s) => s.key === "retrieve")?.ms).toBe(10);
    expect(steps.find((s) => s.key === "model")?.ms).toBeUndefined();
  });
  it("shows no retrieval rows for a refusal and rounds the total", () => {
    const t = buildTrace(result("scope"), describe_, 123);
    expect(t.retrieval).toEqual([]);
    expect(t.totalMs).toBe(100);
    expect(buildTrace(result("answered"), describe_, 123).retrieval).toHaveLength(1);
  });
});
