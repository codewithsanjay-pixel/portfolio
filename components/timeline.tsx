export type DetailGroup = { label: string; items: readonly string[] };

export type TimelineEntry = {
  id: string;
  dates: string;
  title: string;
  org: string;
  summary: string;
  groups?: readonly DetailGroup[];
};

export function Timeline({ entries }: { entries: readonly TimelineEntry[] }) {
  return (
    <ol className="timeline">
      {entries.map((entry) => (
        <li key={entry.id} id={entry.id} className="timeline-item">
          <p className="timeline-dates">{entry.dates}</p>
          <h3 className="timeline-title">{entry.title}</h3>
          <p className="timeline-org">{entry.org}</p>
          <p>{entry.summary}</p>
          {entry.groups && entry.groups.length > 0 ? (
            <details>
              <summary>Details</summary>
              {entry.groups.map((group) => (
                <div key={group.label} className="detail-group">
                  <h4>{group.label}</h4>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
