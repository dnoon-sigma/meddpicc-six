import Link from "next/link";
import { loadLeague } from "@/lib/league";
import { Empty } from "@/components/DataTable";

export const revalidate = 300;

export default async function Weeks() {
  const l = await loadLeague();
  const weeks = [...new Set(l.matchups.map((m) => m.week))].sort((a, b) => b - a);
  return (
    <main>
      <h1 className="text-2xl font-semibold">Weeks</h1>
      {weeks.length === 0 && <Empty />}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {weeks.map((w) => {
          const live = l.matchups.some((m) => m.week === w && !m.final);
          return (
            <Link key={w} href={`/weeks/${w}`} className="rounded-lg border border-neutral-800 p-4 hover:border-neutral-600">
              <div className="font-medium">Week {w}</div>
              <div className="text-xs text-neutral-500">{live ? "In progress" : "Final"}</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
