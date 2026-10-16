export type Fact = { label: string; value: string | readonly string[] };

// Labelled rows: projects (problem, what I built, ...) and case studies.
export function Facts({ items }: { items: readonly Fact[] }) {
  return (
    <dl className="facts">
      {items.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>
            {typeof fact.value === "string" ? (
              fact.value
            ) : (
              <ul>
                {fact.value.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
