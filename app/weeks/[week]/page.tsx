import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLeague, teamName, League } from "@/lib/league";
import { Avatar, TugBar, Title } from "@/components/ui";

export const revalidate = 300;

const SLOT: Record<number, string> = { 0: "QB", 2: "RB", 4: "WR", 6: "TE", 16: "D/ST", 17: "K", 23: "FLEX", 20: "BN", 21: "IR" };
const ORDER = [0, 2, 4, 6, 23, 16, 17, 20, 21];

function Lineup({ l, week, team }: { l: League; week: number; team: number }) {
  const rows = l.entries
    .filter((e) => e.week === week && e.team_id === team)
    .sort((a, b) => ORDER.indexOf(a.slot_id) - ORDER.indexOf(b.slot_id) || b.points - a.points);
  return (
    <ul className="mt-2 space-y-1 text-xs">
      {rows.map((e) => (
        <li key={e.player_id} className={`flex justify-between ${e.is_starter ? "" : "text-slate-500"}`}>
          <span>
            <span className="inline-block w-9 text-slate-500">{SLOT[e.slot_id]}</span>
            {l.players.get(e.player_id)?.name}
          </span>
          <span className="tabular-nums">{e.points.toFixed(1)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function Week({ params }: { params: Promise<{ week: string }> }) {
  const week = Number((await params).week);
  const l = await loadLeague();
  const games = l.matchups.filter((m) => m.week === week);
  if (!games.length) notFound();
  return (
    <main>
      <Link href="/weeks" className="text-sm text-slate-400 hover:text-white">← All weeks</Link>
      <div className="mt-3"><Title sub="Tap a game to open both lineups.">Week {week}</Title></div>
      <div className="space-y-3">
        {games.map((m) => (
          <details key={m.home_team} className="card card-hover p-4">
            <summary className="cursor-pointer list-none">
              {[
                [m.away_team, m.away_score, m.winner === "AWAY"],
                [m.home_team, m.home_score, m.winner === "HOME"],
              ].map(([id, score, won]) => (
                <div key={id as number} className={`flex items-center gap-3 py-1 ${won ? "font-semibold" : "text-slate-400"}`}>
                  <Avatar id={id as number} name={teamName(l, id as number)} size={28} />
                  <span className="flex-1 truncate">{teamName(l, id as number)}{won ? " 👑" : ""}</span>
                  <span className="font-display tabular-nums">{(score as number).toFixed(1)}</span>
                </div>
              ))}
              <div className="mt-2"><TugBar a={m.away_score} b={m.home_score} /></div>
              {!m.final && <div className="mt-1.5 text-xs text-amber">● In progress</div>}
            </summary>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {[m.away_team, m.home_team].map((t) => (
                <div key={t}>
                  <div className="text-xs font-medium text-slate-300">{teamName(l, t)}</div>
                  <Lineup l={l} week={week} team={t} />
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
