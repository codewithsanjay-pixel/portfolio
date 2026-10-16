// Answer model interface (SPEC.md: one LLM provider behind a small interface).
// OpenAI Responses API with a strict JSON schema (ADR 007). No provider types
// leave this file.
import { requireEnv, type Env } from "./env";

export type SourceChunk = { id: string; context: string; text: string };

export type ModelAnswer = {
  refused: boolean;
  answer: string;
  citations: string[];
};

export type AnswerModel = {
  answer(input: { system: string; question: string; sources: readonly SourceChunk[] }): Promise<ModelAnswer>;
};

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const EFFORTS = new Set(["none", "low", "medium", "high"]);

export const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    refused: { type: "boolean" },
    answer: { type: "string" },
    citations: { type: "array", items: { type: "string" } },
  },
  required: ["refused", "answer", "citations"],
  additionalProperties: false,
} as const;

// Sources go in as data, clearly delimited, never as instructions.
export function formatSources(question: string, sources: readonly SourceChunk[]): string {
  return JSON.stringify({ question, sources: sources.map((s) => ({ id: s.id, section: s.context, text: s.text })) });
}

export function createAnswerModel(env: Env = process.env, fetchImpl: FetchLike = fetch, timeoutMs = 20_000): AnswerModel {
  const apiKey = requireEnv("OPENAI_API_KEY", env);
  const model = requireEnv("LLM_MODEL", env);
  const effort = env.LLM_REASONING_EFFORT?.trim() || "low";
  if (!EFFORTS.has(effort)) throw new Error("LLM_REASONING_EFFORT must be none, low, medium or high.");

  return {
    async answer({ system, question, sources }) {
      let res: Response;
      try {
        res = await fetchImpl(OPENAI_RESPONSES_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            input: [
              { role: "system", content: system },
              { role: "user", content: formatSources(question, sources) },
            ],
            reasoning: { effort },
            max_output_tokens: 1200,
            store: false,
            text: { format: { type: "json_schema", name: "cited_answer", schema: ANSWER_SCHEMA, strict: true } },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        throw new Error("Answer request did not complete (timeout or network error).");
      }
      if (!res.ok) throw new Error(`Answer request failed with status ${res.status}.`);

      let body: {
        status?: string;
        output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
      };
      try {
        body = (await res.json()) as typeof body;
      } catch {
        throw new Error("Answer response was not valid JSON.");
      }
      if (body.status && body.status !== "completed") throw new Error(`Answer was not completed (${body.status}).`);

      const content = body.output?.find((o) => o.type === "message")?.content?.[0];
      if (!content) throw new Error("Answer response had no message.");
      // The provider's own safety refusal counts as a refusal.
      if (content.type === "refusal") return { refused: true, answer: "", citations: [] };
      if (content.type !== "output_text" || typeof content.text !== "string") throw new Error("Answer response had no text.");

      let parsed: unknown;
      try {
        parsed = JSON.parse(content.text);
      } catch {
        throw new Error("Answer text did not match the schema.");
      }
      const p = parsed as Partial<ModelAnswer>;
      if (typeof p.refused !== "boolean" || typeof p.answer !== "string" || !Array.isArray(p.citations) || p.citations.some((c) => typeof c !== "string")) {
        throw new Error("Answer text did not match the schema.");
      }
      return { refused: p.refused, answer: p.answer, citations: p.citations };
    },
  };
}
