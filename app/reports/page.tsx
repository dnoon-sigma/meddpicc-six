import Link from "next/link";
import { REPORTS } from "@/lib/reports";
import { Title } from "@/components/ui";
import { SurpriseButton } from "@/components/SurpriseButton";

const ACCENTS = ["from-pink/30", "from-cyan/30", "from-lime/25", "from-amber/30", "from-violet-400/30"];

export default function Reports() {
  return (
    <main>
      <Title sub="Pick a report to see who's winning, losing and getting lucky.">🔎 Discover</Title>
      <div className="mb-6"><SurpriseButton hrefs={REPORTS.map((r) => `/reports/${r.slug}`)} label="Random report" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r, i) => (
          <Link
            key={r.slug}
            href={`/reports/${r.slug}`}
            className={`card pop relative overflow-hidden bg-gradient-to-br ${ACCENTS[i % ACCENTS.length]} to-transparent p-5`}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="text-4xl">{r.icon}</div>
            <div className="mt-3 font-display text-lg leading-tight">{r.title}</div>
            <p className="mt-1.5 text-sm text-slate-300/80">{r.blurb}</p>
            <div className="mt-3 text-xs font-semibold text-cyan">Open →</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
