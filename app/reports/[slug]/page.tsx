import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLeague } from "@/lib/league";
import { REPORTS } from "@/lib/reports";
import { DataTable, Empty } from "@/components/DataTable";

export const revalidate = 300;

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = REPORTS.find((r) => r.slug === slug);
  if (!report) notFound();
  const l = await loadLeague();
  const sections = l.matchups.some((m) => m.final) ? report.build(l) : [];
  return (
    <main>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/reports" className="text-neutral-400 hover:text-white">← All reports</Link>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <Link
            key={r.slug}
            href={`/reports/${r.slug}`}
            className={`rounded-full border px-3 py-1 text-xs ${r.slug === slug ? "border-white text-white" : "border-neutral-800 text-neutral-400 hover:border-neutral-600"}`}
          >
            {r.icon} {r.title}
          </Link>
        ))}
      </nav>
      <h1 className="mt-6 text-2xl font-semibold">{report.icon} {report.title}</h1>
      <p className="mt-1 text-sm text-neutral-400">{report.blurb}</p>
      {sections.length === 0 && <Empty />}
      {sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-medium">{s.heading}</h2>
          {s.note && <p className="text-xs text-neutral-500">{s.note}</p>}
          <div className="mt-2"><DataTable columns={s.columns} rows={s.rows} /></div>
        </section>
      ))}
    </main>
  );
}
