// Chat logging (SPEC.md): no user text unless CHAT_DEBUG_LOG is exactly "true",
// for short-lived debugging only. By default only the event and counts are logged.
export type ChatEvent = {
  event: "answered" | "refused" | "rate_limited" | "invalid_input" | "error";
  ms?: number;
  citations?: number;
  reason?: string;
};

export function logChat(e: ChatEvent, question?: string, env: Record<string, string | undefined> = process.env): void {
  const debug = env.CHAT_DEBUG_LOG === "true";
  console.info(JSON.stringify({ scope: "chat", ...e, ...(debug && question ? { question: question.slice(0, 500) } : {}) }));
}
