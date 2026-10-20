import Link from "next/link";
import { loadLeague, teamName } from "@/lib/league";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Empty } from "@/components/DataTable";

export const revalidate = 60;

const LIVE_WINDOW_MS = 10 * 60 * 1000;

export default async function Live() {
  const l = await loadLeague();
  if (!l.matchups.length) return <Empty />;

  // The week being played: earliest week that still has undecided games, else the latest week.
  const open = l.matchups.filter((m) => !m.final).map((m) => m.week);
  const week = open.length ? Math.min(...open) : Math.max(...l.matchups.map((m) => m.week));
  const games = l.matchups.filter((m) => m.week === week);
  const entries = l.entries.filter((e) => e.week === week && e.is_starter);

  const proj = (team: number) => {
    const rows = entries.filter((e) => e.team_id === team && e.projected != null);
    return rows.length ? rows.reduce((a, e) => a + e.projected!, 0) : null;
  };
  const top = (team: number) => entries.filter((e) => e.team_id === team).sort((a, b) => b.points - a.points).slice(0, 3);

  const ageMs = l.lastLive ? Date.now() - new Date(l.lastLive).getTime() : Infinity;
  const isLive = ageMs < LIVE_WINDOW_MS;
  const mins = Math.max(0, Math.round(ageMs / 60000));
  const sorted = [...games].sort(
    (a, b) => Math.abs(a.home_score - a.away_score) - Math.abs(b.home_score - b.away_score),
  );
  const performers = [...entries].sort((a, b) => b.points - a.points).slice(0, 10);

  return (
    <main>
      <AutoRefresh seconds={60} />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Week {week}</h1>
        {isLive ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> LIVE
          </span>
        ) : (
          <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400">
            {open.length ? "No games live" : "Final"}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-neutral-400">
        {l.lastLive
          ? `Scores updated ${mins < 1 ? "just now" : `${mins} min ago`} · refreshes every 5 min during games`
          : "Scores refresh every 5 minutes while NFL games are being played."}
      </p>

      <h2 className="mt-8 font-medium">Matchups <span className="text-xs font-normal text-neutral-500">closest first</span></h2>
      <div className="mt-3 space-y-3">
        {sorted.map((m) => {
          const sides = [
            { id: m.away_team, score: m.away_score },
            { id: m.home_team, score: m.home_score },
          ];
          return (
            <Link key={m.home_team} href={`/weeks/${week}`} className="block rounded-lg border border-neutral-800 p-4 hover:border-neutral-600">
              {sides.map((s) => {
                const p = proj(s.id);
                const lead = s.score > sides.find((x) => x.id !== s.id)!.score;
                return (
                  <div key={s.id} className="py-1">
                    <div className={`flex justify-between ${lead ? "font-semibold" : "text-neutral-400"}`}>
                      <span>{teamName(l, s.id)}</span>
                      <span className="tabular-nums">
                        {s.score.toFixed(1)}
                        {p != null && !m.final && <span className="ml-2 text-xs font-normal text-neutral-500">proj {p.toFixed(1)}</span>}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {top(s.id).map((e) => `${l.players.get(e.player_id)?.name} ${e.points.toFixed(1)}`).join(" · ")}
                    </div>
                  </div>
                );
              })}
              <div className="mt-1 text-xs text-neutral-500">
                {m.final ? "Final" : `Margin ${Math.abs(m.home_score - m.away_score).toFixed(1)}`}
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-10 font-medium">Top starters this week</h2>
      <ul className="mt-3 divide-y divide-neutral-900 text-sm">
        {performers.map((e) => (
          <li key={`${e.team_id}-${e.player_id}`} className="flex justify-between py-2">
            <span>
              {l.players.get(e.player_id)?.name}{" "}
              <span className="text-xs text-neutral-500">{l.players.get(e.player_id)?.position} · {teamName(l, e.team_id)}</span>
            </span>
            <span className="tabular-nums">{e.points.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
