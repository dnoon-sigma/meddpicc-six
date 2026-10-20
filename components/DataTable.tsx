export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-neutral-400">
          <tr className="border-b border-neutral-800">
            {columns.map((c, i) => (
              <th key={i} className={`py-2 pr-4 font-medium ${i >= 2 && typeof rows[0]?.[i] === "number" ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-900">
              {r.map((cell, j) => (
                <td key={j} className="py-2 pr-4 tabular-nums">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Empty() {
  return <p className="mt-8 text-neutral-400">No data yet. The first sync hasn&apos;t run.</p>;
}
