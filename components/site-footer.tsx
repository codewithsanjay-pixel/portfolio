type Props = {
  text: string;
  // Shown as a highlighted line, e.g. "Example profile. Fictional."
  note?: string;
};

export function SiteFooter({ text, note }: Props) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>{text}</p>
        {note ? <p className="footer-note">{note}</p> : null}
      </div>
    </footer>
  );
}
