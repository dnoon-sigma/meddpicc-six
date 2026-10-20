import Link from "next/link";
import { loadLeague, teamName } from "@/lib/league";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Empty } from "@/components/DataTable";
import { Avatar, Medal, SectionTitle, TugBar } from "@/components/ui";

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
  const sorted = [...games].sort((a, b) => Math.abs(a.home_score - a.away_score) - Math.abs(b.home_score - b.away_score));
  const performers = [...entries].sort((a, b) => b.points - a.points).slice(0, 10);

  return (
    <main>
      <AutoRefresh seconds={60} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl sm:text-4xl">📡 Week {week}</h1>
        {isLive ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold tracking-wider text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> LIVE
          </span>
        ) : (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{open.length ? "No games live" : "Final"}</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-400">
        {l.lastLive
          ? `Scores updated ${mins < 1 ? "just now" : `${mins} min ago`} · refreshes every 5 min during games`
          : "Scores refresh every 5 minutes while NFL games are being played."}
      </p>

      <SectionTitle hint="closest first">🎮 Matchups</SectionTitle>
      <div className="space-y-3">
        {sorted.map((m, i) => {
          const sides = [
            { id: m.away_team, score: m.away_score },
            { id: m.home_team, score: m.home_score },
          ];
          return (
            <Link key={m.home_team} href={`/weeks/${week}`} className="card pop block p-4" style={{ animationDelay: `${i * 50}ms` }}>
              {sides.map((s) => {
                const p = proj(s.id);
                const lead = s.score > sides.find((x) => x.id !== s.id)!.score;
                return (
                  <div key={s.id} className="py-1.5">
                    <div className="flex items-center gap-3">
                      <Avatar id={s.id} name={teamName(l, s.id)} size={32} />
                      <span className={`min-w-0 flex-1 truncate ${lead ? "font-semibold" : "text-slate-400"}`}>{teamName(l, s.id)}</span>
                      <span className="text-right">
                        <span className={`font-display text-xl tabular-nums ${lead ? "text-lime" : ""}`}>{s.score.toFixed(1)}</span>
                        {p != null && !m.final && <span className="block text-[11px] text-slate-500">proj {p.toFixed(1)}</span>}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate pl-11 text-[11px] text-slate-500">
                      {top(s.id).map((e) => `${l.players.get(e.player_id)?.name} ${e.points.toFixed(1)}`).join(" · ")}
                    </div>
                  </div>
                );
              })}
              <div className="mt-2"><TugBar a={sides[0].score} b={sides[1].score} /></div>
              <div className="mt-1.5 text-xs text-slate-500">
                {m.final ? "Final" : `Margin ${Math.abs(m.home_score - m.away_score).toFixed(1)}`}
              </div>
            </Link>
          );
        })}
      </div>

      <SectionTitle>⭐ Top starters this week</SectionTitle>
      <div className="card divide-y divide-line/40">
        {performers.map((e, i) => (
          <div key={`${e.team_id}-${e.player_id}`} className="flex items-center gap-3 p-3 text-sm">
            <Medal rank={i + 1} />
            <span className="flex-1">
              {l.players.get(e.player_id)?.name}
              <span className="block text-xs text-slate-500">{l.players.get(e.player_id)?.position} · {teamName(l, e.team_id)}</span>
            </span>
            <span className="font-display tabular-nums">{e.points.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
