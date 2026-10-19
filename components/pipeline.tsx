// The chat backend as a flow of six stages. Keys match StepKey in lib/chat/trace.ts
// and the order matches lib/chat/answer.ts and the route. Styles: app/pipeline.css.
import type { StepKey } from "@/lib/chat/trace";

export const PIPELINE_STAGES: readonly { key: StepKey; title: string; text: string; tech: string }[] = [
  {
    key: "rate",
    title: "Rate limit",
    text: "Limits how often one visitor, and the site as a whole, can ask questions.",
    tech: "Upstash Redis",
  },
  {
    key: "input",
    title: "Input check",
    text: "Refuses hidden or lookalike characters, and questions that try to script the answer, before any search or model call.",
    tech: "Plain TypeScript",
  },
  {
    key: "retrieve",
    title: "Retrieval",
    text: "Turns the question into an embedding and finds the closest passages of my resume.",
    tech: "pgvector in Neon",
  },
  {
    key: "scope",
    title: "Scope check",
    text: "Refuses the question if even the best passage is not close enough to be about my work.",
    tech: "Similarity threshold",
  },
  {
    key: "model",
    title: "Model",
    text: "Writes an answer from the retrieved passages only, and names the passages it used.",
    tech: "OpenAI",
  },
  {
    key: "checks",
    title: "Answer checks",
    text: "The server confirms every citation was retrieved, then blocks unlisted links, private words, and numbers or names the sources do not state.",
    tech: "Server-side checks",
  },
];

export function Pipeline() {
  return (
    <div className="pl">
      <ol className="pl-list" aria-label="How the chat backend handles a question, in order">
        {PIPELINE_STAGES.map((s, i) => (
          <li key={s.key} className="pl-stage" data-step={s.key}>
            <div className="pl-card">
              <span className="pl-num" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="pl-title">{s.title}</h3>
              <p className="pl-text">{s.text}</p>
              <span className="pl-tag">{s.tech}</span>
            </div>
            {i < PIPELINE_STAGES.length - 1 ? (
              <span className={`pl-link d${i + 1}`} aria-hidden="true">
                <span className="pl-pulse" />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="pl-note">Every refusal returns the same fixed message.</p>
    </div>
  );
}
