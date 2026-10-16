export type ProofPoint = {
  text: string;
  // How the number is measured. Required whenever the point states a number.
  measure?: string;
};

export function ProofPoints({ items }: { items: readonly ProofPoint[] }) {
  return (
    <ul className="proof" aria-label="Highlights">
      {items.map((item) => (
        <li key={item.text}>
          {item.text}
          {item.measure ? <span className="proof-measure">How measured: {item.measure}</span> : null}
        </li>
      ))}
    </ul>
  );
}
