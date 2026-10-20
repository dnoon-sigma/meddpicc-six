import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLeague, teamName, League } from "@/lib/league";

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
        <li key={e.player_id} className={`flex justify-between ${e.is_starter ? "" : "text-neutral-500"}`}>
          <span>
            <span className="inline-block w-9 text-neutral-500">{SLOT[e.slot_id]}</span>
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
      <Link href="/weeks" className="text-sm text-neutral-400 hover:text-white">← All weeks</Link>
      <h1 className="mt-2 text-2xl font-semibold">Week {week}</h1>
      <div className="mt-6 space-y-4">
        {games.map((m) => (
          <details key={m.home_team} className="rounded-lg border border-neutral-800 p-4">
            <summary className="cursor-pointer list-none">
              {[
                [m.away_team, m.away_score, m.winner === "AWAY"],
                [m.home_team, m.home_score, m.winner === "HOME"],
              ].map(([id, score, won]) => (
                <div key={id as number} className={`flex justify-between ${won ? "font-semibold" : "text-neutral-400"}`}>
                  <span>{teamName(l, id as number)}</span>
                  <span className="tabular-nums">{(score as number).toFixed(1)}</span>
                </div>
              ))}
              {!m.final && <div className="mt-1 text-xs text-amber-500">In progress</div>}
            </summary>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {[m.away_team, m.home_team].map((t) => (
                <div key={t}>
                  <div className="text-xs font-medium text-neutral-300">{teamName(l, t)}</div>
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
