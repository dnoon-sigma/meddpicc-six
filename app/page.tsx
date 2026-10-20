import { getStandings } from "@/lib/espn";

export const revalidate = 300;

export default async function Home() {
  const { week, standings } = await getStandings();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Standings</h1>
      <p className="mt-1 text-sm text-neutral-400">Week {week} · live from ESPN</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-400">
            <tr className="border-b border-neutral-800">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-4">Team</th>
              <th className="py-2 pr-4">Record</th>
              <th className="py-2 pr-4 text-right">PF</th>
              <th className="py-2 pr-4 text-right">PA</th>
              <th className="py-2 text-right">Streak</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.id} className="border-b border-neutral-900">
                <td className="py-2 pr-2 text-neutral-500">{i + 1}</td>
                <td className="py-2 pr-4">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-neutral-500">{s.owner}</div>
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  {s.wins}-{s.losses}
                  {s.ties ? `-${s.ties}` : ""}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{s.pointsFor.toFixed(1)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{s.pointsAgainst.toFixed(1)}</td>
                <td className="py-2 text-right tabular-nums">{s.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
