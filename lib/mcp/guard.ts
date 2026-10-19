// The chat's output guards, applied to every piece of text the MCP tools return.
// A failing passage is dropped without a reason, so the tools cannot be used to probe
// what the guards look for.
import { containsPrivateTerm, unsafeAnswer, type ChatDeps } from "../chat/answer";

export type GuardDeps = Pick<ChatDeps, "allowedUrls" | "privateTerms">;

export function passesGuards(text: string, deps: GuardDeps): boolean {
  if (!text.trim()) return false;
  if (unsafeAnswer(text, deps.allowedUrls)) return false;
  if (containsPrivateTerm(text, deps.privateTerms ?? [])) return false;
  return true;
}
