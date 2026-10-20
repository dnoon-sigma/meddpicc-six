import Link from "next/link";
import { loadLeague, standings, teamName } from "@/lib/league";
import { computeTeamStats, weekAwards } from "@/lib/stats";
import { REPORTS } from "@/lib/reports";
import { SectionTitle, Title } from "@/components/ui";
import { Flips } from "@/components/Flips";
import { Jail } from "@/components/Jail";
import { excerpt, loadRecaps } from "@/lib/recaps";
import { Empty } from "@/components/DataTable";
import { SurpriseButton } from "@/components/SurpriseButton";

export const revalidate = 300;

export default async function Home() {
  const [l, recaps] = await Promise.all([loadLeague(), loadRecaps()]);
  const latestRecap = recaps[0];
  const { throughWeek, rows } = standings(l);
  if (throughWeek === 0) return <Empty />;
  const stats = computeTeamStats(l);
  const awards = weekAwards(l, throughWeek);
  const holders = [...stats.values()].flatMap((t) => t.badges.map((b) => ({ ...b, team: t.id })));
  const surprise = [...REPORTS.map((r) => `/reports/${r.slug}`), ...rows.map((r) => `/teams/${r.id}`)];

  return (
    <main>
      <Title sub={`Through week ${throughWeek} · tap anything to dig in`}>MEDDPICC 6</Title>
      <div className="mb-2 flex flex-wrap gap-3">
        <SurpriseButton hrefs={surprise} />
        <Link href="/standings" className="rounded-full border border-line px-5 py-2.5 font-display text-sm tracking-wide hover:border-cyan">
          📊 Standings
        </Link>
        <Link href="/live" className="rounded-full border border-line px-5 py-2.5 font-display text-sm tracking-wide hover:border-cyan">
          📡 Live board
        </Link>
      </div>

      {latestRecap && (
        <Link href={`/recaps/${latestRecap.week}`} className="card pop mt-6 block p-5">
          <div className="font-display text-xs tracking-wider text-amber">📝 LATEST RECAP · WEEK {latestRecap.week}</div>
          <div className="mt-1 font-display text-lg leading-tight">{latestRecap.title || `Week ${latestRecap.week} recap`}</div>
          <p className="mt-2 text-sm text-slate-400">{excerpt(latestRecap.body, 140)}</p>
          <div className="mt-2 text-xs font-semibold text-cyan">Read it →</div>
        </Link>
      )}

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

      <Flips l={l} />

      <Jail l={l} />

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
