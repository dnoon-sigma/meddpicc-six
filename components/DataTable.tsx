import { Medal } from "./ui";

const tone = (cell: string | number) => {
  const s = String(cell);
  return /^\+\d/.test(s) ? "text-lime" : /^-\d/.test(s) ? "text-pink" : "";
};

export function DataTable({
  columns,
  rows,
  ranked = false,
}: {
  columns: string[];
  rows: (string | number)[][];
  ranked?: boolean;
}) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-slate-400">
          <tr className="border-b border-line">
            {ranked && <th className="w-10 py-3 pl-3" />}
            {columns.map((c, i) => (
              <th key={i} className={`px-3 py-3 font-semibold ${i === 0 && !ranked ? "pl-4" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/40 last:border-0 hover:bg-white/5">
              {ranked && (
                <td className="py-2.5 pl-3">
                  <Medal rank={i + 1} />
                </td>
              )}
              {r.map((cell, j) => (
                <td key={j} className={`px-3 py-2.5 tabular-nums ${j === 0 && !ranked ? "pl-4" : ""} ${tone(cell)}`}>
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
  return (
    <div className="card mt-8 p-8 text-center">
      <div className="text-4xl">⏳</div>
      <p className="mt-2 text-slate-400">No data yet. The first sync hasn&apos;t run.</p>
    </div>
  );
}
