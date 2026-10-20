import Link from "next/link";
import { League, teamName } from "@/lib/league";
import { jail } from "@/lib/stats";
import { Avatar, SectionTitle } from "./ui";

const REASON = { BYE: "😴 on a BYE", OUT: "🚑 didn't play", EMPTY: "🕳️ left empty" } as const;

export function Jail({ l }: { l: League }) {
  const { week, inmates } = jail(l);
  if (week === null) return null;
  return (
    <>
      <SectionTitle hint={`week ${week} · left a slot empty or started someone who didn't play`}>🚔 Fantasy jail</SectionTitle>
      <div className="relative overflow-hidden rounded-2xl border border-slate-500/40 bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.10)_0_6px,transparent_6px_44px)] bg-gradient-to-b from-slate-800/60 to-slate-900/80 p-4">
        {inmates.length === 0 ? (
          <div className="py-6 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-2 font-display text-sm tracking-wide text-lime">THE JAIL IS EMPTY</p>
            <p className="text-xs text-slate-400">Everybody started players who actually played in week {week}.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {inmates.map((m) => (
              <Link key={m.teamId} href={`/teams/${m.teamId}`} className="card card-hover relative p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar id={m.teamId} name={teamName(l, m.teamId)} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold leading-tight">{teamName(l, m.teamId)}</div>
                  </div>
                  <span className="text-xl">⛓️</span>
                </div>
                <ul className="mt-2.5 space-y-1 text-sm">
                  {m.players.map((p, i) => (
                    <li key={`${p.name}-${i}`} className="flex justify-between gap-2">
                      <span className="truncate">
                        {p.name} <span className="text-xs text-slate-500">{p.position}</span>
                      </span>
                      <span className="shrink-0 text-xs text-amber">{REASON[p.reason]}</span>
                    </li>
                  ))}
                </ul>
                {m.priors > 0 && (
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-pink">
                    🔒 repeat offender · {m.priors} prior{m.priors > 1 ? "s" : ""}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
