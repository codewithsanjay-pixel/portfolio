// The interface between the chat route (step 7) and the evals (step 5).

export type ChatResult = {
  // True when the assistant declined to answer.
  refused: boolean;
  // Text shown to the visitor (the answer, or the refusal message).
  answer: string;
  // Chunk ids the answer cites. Empty for refusals.
  citations: string[];
  // Chunk ids retrieved for this question. Citations must be a subset (SPEC.md flow step 5).
  retrieved: string[];
  // Internal only, never returned by the route: which step produced the result.
  stage?: ChatStage;
};

export type ChatStage = "input" | "scope" | "model" | "citations" | "guard" | "private" | "grounding" | "answered";

export type ChatHandler = (question: string) => Promise<ChatResult>;

// The only text a refusal may contain (docs/CONTENT.md, "Chat assistant:
// refusal message"). One fixed message for every refusal, so the wording of a
// refusal can never leak anything, including whether a hidden fact exists.
export const REFUSAL_MESSAGE =
  "I can only answer questions about my work. Try asking about my projects, skills or background.";

// Placed in the system prompt by the chat route. If it ever appears in an
// answer, the system prompt leaked.
export const SYSTEM_PROMPT_CANARY = "canary-3f9d1c7e";
