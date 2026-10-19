import { adrUrl, decisionColumns as col, type Decision } from "@/content/decisions";

export function DecisionTable({ rows, caption }: { rows: readonly Decision[]; caption: string }) {
  return (
    <div className="table-wrap decision-wrap">
      <table className="decision-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{col.decision}</th>
            <th scope="col">{col.chose}</th>
            <th scope="col">{col.rejected}</th>
            <th scope="col">{col.record}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.adr}>
              <th scope="row" data-label={col.decision}>
                {row.decision}
              </th>
              <td data-label={col.chose}>{row.chose}</td>
              <td data-label={col.rejected}>{row.rejected}</td>
              <td data-label={col.record}>
                <a href={adrUrl(row)} rel="noreferrer">
                  ADR {row.number}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
