import Link from "next/link";
import { loadLeague, standings, teamName } from "@/lib/league";
import { computeTeamStats, weekAwards } from "@/lib/stats";
import { REPORTS } from "@/lib/reports";
import { Avatar, Medal, Ovr, SectionTitle, StreakBadge, Title } from "@/components/ui";
import { Empty } from "@/components/DataTable";
import { SurpriseButton } from "@/components/SurpriseButton";

export const revalidate = 300;

export default async function Home() {
  const l = await loadLeague();
  const { throughWeek, rows } = standings(l);
  if (throughWeek === 0) return <Empty />;
  const stats = computeTeamStats(l);
  const awards = weekAwards(l, throughWeek);
  const maxPf = Math.max(...rows.map((r) => r.pf));
  const holders = [...stats.values()].flatMap((t) => t.badges.map((b) => ({ ...b, team: t.id })));
  const surprise = [...REPORTS.map((r) => `/reports/${r.slug}`), ...rows.map((r) => `/teams/${r.id}`)];

  return (
    <main>
      <Title sub={`Through week ${throughWeek} · tap anything to dig in`}>The League</Title>
      <div className="mb-2 flex flex-wrap gap-3">
        <SurpriseButton hrefs={surprise} />
        <Link href="/live" className="rounded-full border border-line px-5 py-2.5 font-display text-sm tracking-wide hover:border-cyan">
          📡 Live board
        </Link>
      </div>

      <SectionTitle hint={`week ${throughWeek}`}>🏅 Weekly awards</SectionTitle>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {awards.map((a, i) => {
          const body = (
            <>
              <div className="text-3xl">{a.icon}</div>
              <div className="mt-2 font-display text-xs tracking-wider text-amber">{a.title.toUpperCase()}</div>
              <div className="mt-1 font-semibold leading-tight">{a.who}</div>
              <div className="mt-0.5 text-xs text-slate-400">{a.detail}</div>
            </>
          );
          const cls = "card pop w-44 shrink-0 snap-start p-4";
          return a.teamId ? (
            <Link key={a.title} href={`/teams/${a.teamId}`} className={cls} style={{ animationDelay: `${i * 60}ms` }}>{body}</Link>
          ) : (
            <div key={a.title} className={cls}>{body}</div>
          );
        })}
      </div>

      <SectionTitle hint="tap a team for its profile">📊 Standings</SectionTitle>
      <div className="space-y-2.5">
        {rows.map((s, i) => {
          const t = stats.get(s.id)!;
          const name = teamName(l, s.id);
          return (
            <Link key={s.id} href={`/teams/${s.id}`} className="card pop flex items-center gap-3 p-3" style={{ animationDelay: `${i * 35}ms` }}>
              <Medal rank={i + 1} />
              <Avatar id={s.id} name={name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{name}</span>
                  <StreakBadge type={t.streak.type} n={t.streak.n} />
                </div>
                <div className="truncate text-xs text-slate-500">{l.teams.get(s.id)?.owner}</div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/40">
                  <div className="fill h-full rounded-full bg-gradient-to-r from-pink to-amber" style={{ width: `${(s.pf / maxPf) * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg tabular-nums">
                  {s.wins}-{s.losses}
                  {s.ties ? `-${s.ties}` : ""}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">{s.pf.toFixed(0)} PF</div>
              </div>
              <Ovr value={t.ratings.ovr} />
            </Link>
          );
        })}
      </div>

      <SectionTitle hint="who holds each title right now">🏆 Trophy case</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {holders.map((h, i) => (
          <Link key={h.label} href={`/teams/${h.team}`} className="card pop p-3.5" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="text-2xl">{h.icon}</div>
            <div className="mt-1 font-display text-[11px] tracking-wider text-lime">{h.label.toUpperCase()}</div>
            <div className="text-sm font-semibold leading-tight">{teamName(l, h.team)}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-slate-500">{h.blurb}</div>
          </Link>
        ))}
      </div>
      {l.lastSync && <p className="mt-10 text-xs text-slate-600">Updated {new Date(l.lastSync).toLocaleString()}</p>}
    </main>
  );
}
