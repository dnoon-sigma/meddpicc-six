import { loadLeague, standings, teamName } from "@/lib/league";
import { computeTeamStats } from "@/lib/stats";
import { Title } from "@/components/ui";
import { Empty } from "@/components/DataTable";
import { StandingsList } from "@/components/StandingsList";

export const revalidate = 300;

export default async function Standings() {
  const l = await loadLeague();
  const { throughWeek, rows } = standings(l);
  if (throughWeek === 0) return <Empty />;
  const stats = computeTeamStats(l);
  return (
    <main>
      <Title sub={`Through week ${throughWeek} · sort it however you like · tap a team for its profile`}>📊 Standings</Title>
      <StandingsList
        rows={rows.map((s) => {
          const t = stats.get(s.id)!;
          return {
            id: s.id,
            name: teamName(l, s.id),
            owner: l.teams.get(s.id)?.owner ?? null,
            wins: s.wins,
            losses: s.losses,
            ties: s.ties,
            pf: s.pf,
            pa: s.pa,
            ovr: t.ratings.ovr,
            streakType: t.streak.type,
            streakN: t.streak.n,
          };
        })}
      />
      {l.lastSync && <p className="mt-10 text-xs text-slate-600">Updated {new Date(l.lastSync).toLocaleString()}</p>}
    </main>
  );
}
