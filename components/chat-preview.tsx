// Static chat panel: shows how answers, citations and refusals look.
// The live, interactive panel replaces this on real pages once the chat route exists.

export type PreviewMessage = {
  role: "user" | "bot";
  text: string;
  label?: string;
  citations?: readonly string[];
};

type Props = {
  title: string;
  badge: string;
  hint?: string;
  messages: readonly PreviewMessage[];
  starters: readonly string[];
  startersLabel?: string;
};

export function ChatPreview({ title, badge, hint, messages, starters, startersLabel = "Starter questions:" }: Props) {
  return (
    <aside className="chat" aria-label={title}>
      <div className="chat-head">
        <h2>{title}</h2>
        <span className="badge">{badge}</span>
      </div>
      {hint ? <p className="chat-hint">{hint}</p> : null}
      <div className="chat-log">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "msg-user" : "msg-bot"}`}>
            {m.label ? <p className="msg-label">{m.label}</p> : null}
            <p>{m.text}</p>
            {m.citations && m.citations.length > 0 ? (
              <ul className="citations" aria-label="Sources">
                {m.citations.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
      <p className="chips-label">{startersLabel}</p>
      <ul className="chips">
        {starters.map((s) => (
          <li key={s}>
            <span className="chip">{s}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
