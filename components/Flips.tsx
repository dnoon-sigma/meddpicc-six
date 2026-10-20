import Link from "next/link";
import { League, teamName } from "@/lib/league";
import { lineupFlips } from "@/lib/stats";
import { Avatar, SectionTitle } from "./ui";

export function Flips({ l }: { l: League }) {
  const { week, flips } = lineupFlips(l);
  if (week === null) return null;
  return (
    <>
      <SectionTitle hint={`week ${week} · lost, but the best lineup on their own roster would have won`}>🧠 Should&apos;ve started…</SectionTitle>
      {flips.length === 0 ? (
        <div className="card p-6 text-center">
          <div className="text-3xl">✅</div>
          <p className="mt-2 text-sm text-slate-400">Nobody lost to their own lineup in week {week}. Every loss was a fair fight.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {flips.map((f) => (
            <Link key={f.loser} href={`/weeks/${f.week}`} className="card card-hover p-4">
              <div className="flex items-center gap-3">
                <Avatar id={f.loser} name={teamName(l, f.loser)} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold leading-tight">{teamName(l, f.loser)}</div>
                  <div className="truncate text-xs text-slate-500">
                    lost {f.loserScore.toFixed(1)}–{f.winnerScore.toFixed(1)} to {teamName(l, f.winner)}
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-black/30 p-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Best possible lineup</span>
                  <span className="font-display tabular-nums text-lime">{f.best.toFixed(1)}</span>
                </div>
                <div className="mt-0.5 flex justify-between text-xs">
                  <span className="text-slate-500">would have won by</span>
                  <span className="tabular-nums text-lime">+{(f.best - f.winnerScore).toFixed(1)}</span>
                </div>
              </div>
              {f.missed.length > 0 && (
                <div className="mt-2.5 text-xs text-slate-400">
                  <span className="text-amber">Left on the bench:</span>{" "}
                  {f.missed.slice(0, 3).map((p) => `${p.name} (${p.points.toFixed(1)})`).join(" · ")}
                </div>
              )}
              {f.priors > 0 && (
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-pink">
                  🧠 {f.priors} earlier this season
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
