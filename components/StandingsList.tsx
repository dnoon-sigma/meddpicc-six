"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, Medal, Ovr, StreakBadge } from "./ui";

export type StandingRow = {
  id: number;
  name: string;
  owner: string | null;
  wins: number;
  losses: number;
  ties: number;
  pf: number;
  pa: number;
  ovr: number;
  streakType: "W" | "L" | "T" | null;
  streakN: number;
};

type Key = "record" | "ovr" | "pf" | "pa";

const OPTIONS: { key: Key; label: string; lowFirst?: boolean }[] = [
  { key: "record", label: "Record" },
  { key: "ovr", label: "Rating" },
  { key: "pf", label: "Points for" },
  { key: "pa", label: "Points against", lowFirst: true },
];

const pct = (r: StandingRow) => (r.wins + r.ties / 2) / Math.max(1, r.wins + r.losses + r.ties);

export function StandingsList({ rows }: { rows: StandingRow[] }) {
  const [key, setKey] = useState<Key>("record");
  const [flipped, setFlipped] = useState(false);
  const opt = OPTIONS.find((o) => o.key === key)!;
  // Best first by default. Points against is best when lowest, so it starts ascending.
  const lowFirst = !!opt.lowFirst !== flipped;

  const sorted = useMemo(() => {
    const value = (r: StandingRow) => (key === "record" ? pct(r) : r[key]);
    return [...rows].sort((a, b) => {
      const d = value(a) - value(b);
      const primary = lowFirst ? d : -d;
      return primary || b.pf - a.pf;
    });
  }, [rows, key, lowFirst]);

  const maxPf = Math.max(...rows.map((r) => r.pf));

  return (
    <>
      <div className="no-scrollbar -mx-4 mb-3 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <span className="shrink-0 text-xs text-slate-500">Sort by</span>
        {OPTIONS.map((o) => {
          const on = o.key === key;
          return (
            <button
              key={o.key}
              onClick={() => {
                if (on) setFlipped((f) => !f);
                else {
                  setKey(o.key);
                  setFlipped(false);
                }
              }}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                on ? "border-cyan bg-cyan/15 text-white" : "border-line text-slate-400 hover:border-slate-500 hover:text-white"
              }`}
            >
              {o.label}
              {on && <span className="ml-1">{lowFirst ? "↑" : "↓"}</span>}
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {sorted.map((s, i) => (
          <Link key={s.id} href={`/teams/${s.id}`} className="card flex items-center gap-3 p-3">
            <Medal rank={i + 1} />
            <Avatar id={s.id} name={s.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{s.name}</span>
                <StreakBadge type={s.streakType} n={s.streakN} />
              </div>
              <div className="truncate text-xs text-slate-500">{s.owner}</div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/40">
                <div className="h-full rounded-full bg-gradient-to-r from-pink to-amber transition-all duration-500" style={{ width: `${(s.pf / maxPf) * 100}%` }} />
              </div>
            </div>
            <div className="text-right">
              <div className={`font-display text-lg tabular-nums ${key === "record" ? "text-lime" : ""}`}>
                {s.wins}-{s.losses}
                {s.ties ? `-${s.ties}` : ""}
              </div>
              <div className="text-[11px] tabular-nums text-slate-500">
                <span className={key === "pf" ? "text-lime" : ""}>{s.pf.toFixed(0)} PF</span>
                {" · "}
                <span className={key === "pa" ? "text-lime" : ""}>{s.pa.toFixed(0)} PA</span>
              </div>
            </div>
            <span className={key === "ovr" ? "rounded-lg bg-lime/10 px-1" : ""}>
              <Ovr value={s.ovr} />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
