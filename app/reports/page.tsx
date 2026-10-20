import Link from "next/link";
import { REPORTS } from "@/lib/reports";

export default function Reports() {
  return (
    <main>
      <h1 className="text-2xl font-semibold">Reports</h1>
      <p className="mt-1 text-sm text-neutral-400">Fun curiosities from the league&apos;s numbers.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Link key={r.slug} href={`/reports/${r.slug}`} className="rounded-lg border border-neutral-800 p-5 hover:border-neutral-600">
            <div className="text-2xl">{r.icon}</div>
            <div className="mt-2 font-medium">{r.title}</div>
            <p className="mt-1 text-sm text-neutral-400">{r.blurb}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
