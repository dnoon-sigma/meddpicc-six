import { loadLeague, teamName } from "@/lib/league";
import { computeTeamStats, TeamStats } from "@/lib/stats";
import { Avatar, Ovr, SectionTitle, Title, f1 } from "@/components/ui";
import { Empty } from "@/components/DataTable";

export const revalidate = 300;

const ROWS: { label: string; get: (t: TeamStats) => number; fmt: (n: number) => string; low?: boolean }[] = [
  { label: "Attack", get: (t) => t.ratings.atk, fmt: (n) => String(n) },
  { label: "Luck", get: (t) => t.ratings.luck, fmt: (n) => String(n) },
  { label: "Efficiency", get: (t) => t.ratings.eff, fmt: (n) => String(n) },
  { label: "Consistency", get: (t) => t.ratings.con, fmt: (n) => String(n) },
  { label: "Wins", get: (t) => t.wins + t.ties / 2, fmt: (n) => String(n) },
  { label: "Points per game", get: (t) => (t.weekly.length ? t.pf / t.weekly.length : 0), fmt: f1 },
  { label: "Points allowed / game", get: (t) => (t.weekly.length ? t.pa / t.weekly.length : 0), fmt: f1, low: true },
  { label: "Points left on bench", get: (t) => t.bestPts - t.actualPts, fmt: f1, low: true },
];

export default async function Compare({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const { a, b } = await searchParams;
  const l = await loadLeague();
  if (!l.teams.size) return <Empty />;
  const stats = computeTeamStats(l);
  const teams = [...l.teams.values()].sort((x, y) => x.name.localeCompare(y.name));
  const A = a ? stats.get(Number(a)) : undefined;
  const B = b ? stats.get(Number(b)) : undefined;
  const ready = A && B && A.id !== B.id;

  // Replay every completed week as if the two teams had played each other.
  const replay = ready
    ? A.weekly.flatMap((wa) => {
        const wb = B.weekly.find((x) => x.week === wa.week);
        return wb ? [{ week: wa.week, a: wa.score, b: wb.score }] : [];
      })
    : [];
  const replayA = replay.filter((r) => r.a > r.b).length;
  const replayB = replay.filter((r) => r.b > r.a).length;
  const replayTies = replay.length - replayA - replayB;

  const meetings = ready
    ? l.matchups.filter((m) => (m.home_team === A.id && m.away_team === B.id) || (m.home_team === B.id && m.away_team === A.id))
    : [];
  let edgeA = 0;
  let edgeB = 0;
  if (ready) {
    for (const r of ROWS) {
      const va = r.get(A);
      const vb = r.get(B);
      if (va === vb) continue;
      if ((va > vb) !== !!r.low) edgeA++;
      else edgeB++;
    }
  }

  const select = (name: string, value?: string) => (
    <select name={name} defaultValue={value ?? ""} className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm">
      <option value="" disabled>Pick a team…</option>
      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );

  return (
    <main>
      <Title sub="Pick any two teams and see who has the edge.">⚔️ Head to head</Title>
      <form className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {select("a", a)}
        <span className="text-center font-display text-pink">VS</span>
        {select("b", b)}
        <button className="rounded-xl bg-gradient-to-r from-lime to-cyan px-5 py-2.5 font-display text-sm text-black hover:scale-105 active:scale-95">FIGHT</button>
      </form>

      {ready && (
        <div className="pop mt-6">
          <div className="card grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-5 text-center">
            {[A, B].map((t, i) => (
              <div key={t.id} className={`flex flex-col items-center gap-2 ${i === 1 ? "order-3" : "order-1"}`}>
                <Avatar id={t.id} name={teamName(l, t.id)} size={56} />
                <div className="text-sm font-semibold leading-tight">{teamName(l, t.id)}</div>
                <div className="text-xs text-slate-400">{t.wins}-{t.losses}{t.ties ? `-${t.ties}` : ""}</div>
                <Ovr value={t.ratings.ovr} size="lg" />
              </div>
            ))}
            <div className="order-2 font-display text-2xl text-pink">VS</div>
          </div>
          <p className="mt-3 text-center text-sm text-slate-400">
            {edgeA === edgeB ? "Dead even." : `${teamName(l, (edgeA > edgeB ? A : B).id)} wins the matchup of ratings, ${Math.max(edgeA, edgeB)} categories to ${Math.min(edgeA, edgeB)}.`}
          </p>

          <div className="card mt-4 divide-y divide-line/40">
            {ROWS.map((r) => {
              const va = r.get(A);
              const vb = r.get(B);
              const aWins = va !== vb && (va > vb) !== !!r.low;
              const bWins = va !== vb && !aWins;
              return (
                <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={`font-display text-lg tabular-nums ${aWins ? "text-lime" : "text-slate-400"}`}>{r.fmt(va)}</span>
                  <span className="text-center text-xs uppercase tracking-wider text-slate-500">{r.label}</span>
                  <span className={`text-right font-display text-lg tabular-nums ${bWins ? "text-lime" : "text-slate-400"}`}>{r.fmt(vb)}</span>
                </div>
              );
            })}
          </div>

          <SectionTitle hint="every week replayed as if they faced each other">🔁 If they played every week</SectionTitle>
          {replay.length === 0 ? (
            <p className="text-sm text-slate-400">No completed weeks to replay yet.</p>
          ) : (
            <>
              <div className="card mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4 text-center">
                <div>
                  <div className="font-display text-3xl text-lime">{replayA}</div>
                  <div className="truncate text-xs text-slate-400">{teamName(l, A.id)}</div>
                </div>
                <div className="text-xs uppercase tracking-wider text-slate-500">
                  simulated wins{replayTies ? ` · ${replayTies} tie${replayTies > 1 ? "s" : ""}` : ""}
                </div>
                <div>
                  <div className="font-display text-3xl text-lime">{replayB}</div>
                  <div className="truncate text-xs text-slate-400">{teamName(l, B.id)}</div>
                </div>
              </div>
              <div className="card divide-y divide-line/40">
                {replay.map((r) => {
                  const diff = Math.abs(r.a - r.b);
                  return (
                    <div key={r.week} className="grid grid-cols-[2.5rem_1fr_auto_1fr] items-center gap-2 px-4 py-2.5 text-sm">
                      <span className="text-slate-500">Wk {r.week}</span>
                      <span className={`font-display tabular-nums ${r.a > r.b ? "text-lime" : "text-slate-400"}`}>{f1(r.a)}{r.a > r.b ? " 👑" : ""}</span>
                      <span className="text-center text-[11px] text-slate-500">{r.a === r.b ? "tie" : `by ${f1(diff)}`}</span>
                      <span className={`text-right font-display tabular-nums ${r.b > r.a ? "text-lime" : "text-slate-400"}`}>{r.b > r.a ? "👑 " : ""}{f1(r.b)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <SectionTitle>Head to head this season</SectionTitle>
          {meetings.length === 0 ? (
            <p className="text-sm text-slate-400">They haven&apos;t played each other yet.</p>
          ) : (
            <div className="card divide-y divide-line/40">
              {meetings.map((m) => (
                <div key={m.week} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-slate-500">Week {m.week}</span>
                  <span className="tabular-nums">
                    {teamName(l, m.away_team)} {f1(m.away_score)} <span className="text-slate-500">@</span> {teamName(l, m.home_team)} {f1(m.home_score)}
                  </span>
                  {!m.final && <span className="text-xs text-amber">live</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
