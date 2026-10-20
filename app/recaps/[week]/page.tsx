import Link from "next/link";
import { notFound } from "next/navigation";
import { loadRecaps } from "@/lib/recaps";
import { Markdown } from "@/components/Markdown";

export const revalidate = 60;

export default async function RecapPage({ params }: { params: Promise<{ week: string }> }) {
  const week = Number((await params).week);
  const recaps = await loadRecaps(); // newest first
  const idx = recaps.findIndex((r) => r.week === week);
  if (idx < 0) notFound();
  const recap = recaps[idx];
  const newer = recaps[idx - 1];
  const older = recaps[idx + 1];
  return (
    <main>
      <Link href="/recaps" className="text-sm text-slate-400 hover:text-white">← All recaps</Link>
      <article className="mt-4">
        <div className="font-display text-xs tracking-wider text-amber">WEEK {week}</div>
        <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{recap.title || `Week ${week} recap`}</h1>
        <div className="card mt-6 p-5 sm:p-7">
          <Markdown source={recap.body} />
        </div>
        <Link href={`/weeks/${week}`} className="mt-4 inline-block text-sm text-cyan hover:underline">
          See week {week}&apos;s scores and lineups →
        </Link>
      </article>
      <div className="mt-10 grid grid-cols-2 gap-3">
        {older ? (
          <Link href={`/recaps/${older.week}`} className="card p-3.5 text-sm">
            <div className="text-xs text-slate-500">← Previous</div>
            <div className="font-semibold">Week {older.week}</div>
          </Link>
        ) : <span />}
        {newer ? (
          <Link href={`/recaps/${newer.week}`} className="card p-3.5 text-right text-sm">
            <div className="text-xs text-slate-500">Next →</div>
            <div className="font-semibold">Week {newer.week}</div>
          </Link>
        ) : <span />}
      </div>
    </main>
  );
}
