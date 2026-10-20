import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLeague } from "@/lib/league";
import { REPORTS } from "@/lib/reports";
import { DataTable, Empty } from "@/components/DataTable";
import { SectionTitle, Title } from "@/components/ui";

export const revalidate = 300;

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idx = REPORTS.findIndex((r) => r.slug === slug);
  if (idx < 0) notFound();
  const report = REPORTS[idx];
  const next = REPORTS[(idx + 1) % REPORTS.length];
  const l = await loadLeague();
  const sections = l.matchups.some((m) => m.final) ? report.build(l) : [];
  return (
    <main>
      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {REPORTS.map((r) => (
          <Link
            key={r.slug}
            href={`/reports/${r.slug}`}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
              r.slug === slug ? "border-cyan bg-cyan/15 text-white" : "border-line text-slate-400 hover:border-slate-500 hover:text-white"
            }`}
          >
            {r.icon} {r.title}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Title sub={report.blurb}>{report.icon} {report.title}</Title>
      </div>
      {sections.length === 0 && <Empty />}
      {sections.map((s) => (
        <section key={s.heading}>
          <SectionTitle hint={s.note}>{s.heading}</SectionTitle>
          <DataTable columns={s.columns} rows={s.rows} ranked={s.ranked} />
        </section>
      ))}
      <Link href={`/reports/${next.slug}`} className="card mt-10 flex items-center justify-between p-4">
        <span className="text-sm text-slate-400">Next report</span>
        <span className="font-display text-sm">{next.icon} {next.title} →</span>
      </Link>
    </main>
  );
}
