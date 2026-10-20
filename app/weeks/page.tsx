import Link from "next/link";
import { loadLeague } from "@/lib/league";
import { Empty } from "@/components/DataTable";
import { Title } from "@/components/ui";

export const revalidate = 300;

export default async function Weeks() {
  const l = await loadLeague();
  const weeks = [...new Set(l.matchups.map((m) => m.week))].sort((a, b) => b - a);
  return (
    <main>
      <Title sub="Every week's scores and full lineups.">📅 Weeks</Title>
      {weeks.length === 0 && <Empty />}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {weeks.map((w, i) => {
          const games = l.matchups.filter((m) => m.week === w);
          const live = games.some((m) => !m.final);
          const high = Math.max(...games.flatMap((m) => [m.home_score, m.away_score]));
          return (
            <Link key={w} href={`/weeks/${w}`} className="card pop p-4" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="font-display text-xl">WK {w}</div>
              <div className={`mt-1 text-xs font-semibold ${live ? "text-amber" : "text-slate-500"}`}>{live ? "● In progress" : "Final"}</div>
              {high > 0 && <div className="mt-2 text-xs text-slate-400">High: {high.toFixed(1)}</div>}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
