import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLeague, teamName } from "@/lib/league";
import { computeTeamStats } from "@/lib/stats";
import { Avatar, Ovr, RatingBars, ResultChip, SectionTitle, StreakBadge, f1 } from "@/components/ui";

export const revalidate = 300;

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const l = await loadLeague();
  const t = computeTeamStats(l).get(id);
  if (!t) notFound();
  const name = teamName(l, id);
  const finalWeeks = new Set(l.matchups.filter((m) => m.final).map((m) => m.week));
  const starters = l.entries.filter((e) => e.team_id === id && e.is_starter && finalWeeks.has(e.week));
  const best = [...starters].sort((a, b) => b.points - a.points).slice(0, 5);
  const nameOf = (pid: number) => l.players.get(pid)?.name ?? "?";
  const hi = [...t.weekly].sort((a, b) => b.score - a.score)[0];
  const lo = [...t.weekly].sort((a, b) => a.score - b.score)[0];
  const record = `${t.wins}-${t.losses}${t.ties ? `-${t.ties}` : ""}`;

  return (
    <main>
      <Link href="/" className="text-sm text-slate-400 hover:text-white">← Home</Link>
      <div className="card pop mt-3 p-5">
        <div className="flex items-center gap-4">
          <Avatar id={id} name={name} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl leading-tight sm:text-3xl">{name}</h1>
            <div className="text-sm text-slate-400">{l.teams.get(id)?.owner}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-display text-lg">{record}</span>
              <StreakBadge type={t.streak.type} n={t.streak.n} />
            </div>
          </div>
          <Ovr value={t.ratings.ovr} size="lg" />
        </div>
        <div className="mt-5">
          <RatingBars r={t.ratings} />
          <p className="mt-3 text-[11px] text-slate-500">
            ATK scoring · LCK luck · EFF lineup efficiency · CON consistency. All rated against the league (50–99).
          </p>
        </div>
      </div>

      {t.badges.length > 0 && (
        <>
          <SectionTitle>🏆 Titles held</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {t.badges.map((b) => (
              <div key={b.label} className="card flex items-center gap-3 p-3.5">
                <span className="text-3xl">{b.icon}</span>
                <div>
                  <div className="font-display text-xs tracking-wider text-lime">{b.label.toUpperCase()}</div>
                  <div className="text-xs text-slate-400">{b.blurb}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>📅 Season log</SectionTitle>
      <div className="card divide-y divide-line/40">
        {t.weekly.map((w) => (
          <Link key={w.week} href={`/weeks/${w.week}`} className="flex items-center gap-3 p-3 text-sm hover:bg-white/5">
            <ResultChip r={w.result} />
            <span className="w-10 text-slate-500">Wk {w.week}</span>
            <span className="flex-1 truncate">vs {teamName(l, w.oppId)}</span>
            <span className="tabular-nums">
              {f1(w.score)} <span className="text-slate-500">–</span> {f1(w.oppScore)}
            </span>
          </Link>
        ))}
      </div>

      <SectionTitle>📈 Fun numbers</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Points for", f1(t.pf)],
          ["Points against", f1(t.pa)],
          ["Best week", hi ? f1(hi.score) : "–"],
          ["Worst week", lo ? f1(lo.score) : "–"],
          ["Expected wins", f1(t.expected)],
          ["Luck", `${t.luck > 0 ? "+" : ""}${f1(t.luck)}`],
          ["Efficiency", `${(t.efficiency * 100).toFixed(1)}%`],
          ["Left on bench", f1(t.bestPts - t.actualPts)],
        ].map(([k, v]) => (
          <div key={k} className="card p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">{k}</div>
            <div className="font-display text-xl tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <SectionTitle hint="best single-game starter lines">⭐ Stars of the season</SectionTitle>
      <div className="card divide-y divide-line/40">
        {best.map((e, i) => (
          <div key={`${e.week}-${e.player_id}`} className="flex items-center gap-3 p-3 text-sm">
            <span className="w-6 text-center font-display text-slate-500">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
            <span className="flex-1">
              {nameOf(e.player_id)} <span className="text-xs text-slate-500">{l.players.get(e.player_id)?.position} · Wk {e.week}</span>
            </span>
            <span className="font-display tabular-nums">{f1(e.points)}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
