import { loadLeague, standings, teamName } from "@/lib/league";
import { DataTable, Empty } from "@/components/DataTable";

export const revalidate = 300;

export default async function Home() {
  const l = await loadLeague();
  const { throughWeek, rows } = standings(l);
  return (
    <main>
      <h1 className="text-2xl font-semibold">Standings</h1>
      {throughWeek === 0 ? (
        <Empty />
      ) : (
        <>
          <p className="mt-1 text-sm text-neutral-400">Through week {throughWeek}</p>
          <div className="mt-6">
            <DataTable
              columns={["#", "Team", "Record", "PF", "PA", "Streak"]}
              rows={rows.map((s, i) => [
                i + 1,
                `${teamName(l, s.id)}${l.teams.get(s.id)?.owner ? ` (${l.teams.get(s.id)!.owner})` : ""}`,
                `${s.wins}-${s.losses}${s.ties ? `-${s.ties}` : ""}`,
                Number(s.pf.toFixed(1)),
                Number(s.pa.toFixed(1)),
                s.streak,
              ])}
            />
          </div>
        </>
      )}
      {l.lastSync && <p className="mt-8 text-xs text-neutral-600">Updated {new Date(l.lastSync).toLocaleString()}</p>}
    </main>
  );
}
