import Link from "next/link";
import { excerpt, loadRecaps } from "@/lib/recaps";
import { Title } from "@/components/ui";

export const revalidate = 60;

export default async function Recaps() {
  const recaps = await loadRecaps();
  return (
    <main>
      <Title sub="The week, as told by the commissioner.">📝 Weekly recaps</Title>
      {recaps.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl">🖊️</div>
          <p className="mt-2 text-slate-400">No recaps yet. Check back after the next week wraps.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recaps.map((r, i) => (
            <Link key={r.week} href={`/recaps/${r.week}`} className="card pop block p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="font-display text-xs tracking-wider text-amber">WEEK {r.week}</div>
              <div className="mt-1 font-display text-lg leading-tight">{r.title || `Week ${r.week} recap`}</div>
              <p className="mt-2 text-sm text-slate-400">{excerpt(r.body)}</p>
              <div className="mt-3 text-xs font-semibold text-cyan">Read recap →</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
