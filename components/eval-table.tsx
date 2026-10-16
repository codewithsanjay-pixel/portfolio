export type EvalRow = { set: string; tests: string; cases: number; passed: number };

export function EvalTable({ rows, caption }: { rows: readonly EvalRow[]; caption: string }) {
  return (
    <div className="table-wrap">
      <table>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Set</th>
            <th scope="col">What it tests</th>
            <th scope="col">Passed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.set}>
              <td>{row.set}</td>
              <td>{row.tests}</td>
              <td>
                {row.passed} of {row.cases}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
