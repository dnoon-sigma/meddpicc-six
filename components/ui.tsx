import type { ReactNode } from "react";

export const f1 = (n: number) => n.toFixed(1);

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-3xl leading-tight tracking-wide sm:text-4xl">{children}</h1>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <h2 className="mb-3 mt-10 flex items-baseline gap-2 font-display text-lg tracking-wide text-cyan">
      {children}
      {hint && <span className="font-sans text-xs font-normal normal-case tracking-normal text-slate-500">{hint}</span>}
    </h2>
  );
}

/** Colored initials avatar; hue comes from the team id so every team has a stable color. */
export function Avatar({ id, name, size = 40 }: { id: number; name: string; size?: number }) {
  const hue = (id * 47) % 360;
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-display text-white shadow-inner"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 85% 55%), hsl(${(hue + 50) % 360} 85% 38%))`,
      }}
    >
      {initials || "?"}
    </span>
  );
}

export function Medal({ rank }: { rank: number }) {
  const m = ["🥇", "🥈", "🥉"][rank - 1];
  return <span className="inline-block w-7 text-center font-display text-slate-500">{m ?? rank}</span>;
}

export function ovrColor(n: number) {
  return n >= 85 ? "text-lime" : n >= 70 ? "text-cyan" : n >= 60 ? "text-amber" : "text-pink";
}

export function Ovr({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${ovrColor(value)}`}>
      <span className={`font-display ${size === "lg" ? "text-4xl" : "text-xl"}`}>{value}</span>
      <span className="mt-0.5 text-[9px] font-semibold tracking-widest text-slate-500">OVR</span>
    </span>
  );
}

export function StatBar({ label, value, color = "bg-cyan", delay = 0 }: { label: string; value: number; color?: string; delay?: number }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-9 font-semibold tracking-wider text-slate-400">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/40">
        <div className={`fill h-full rounded-full ${color}`} style={{ width: `${value}%`, animationDelay: `${delay}ms` }} />
      </div>
      <span className="w-6 text-right font-display text-sm tabular-nums">{value}</span>
    </div>
  );
}

export function RatingBars({ r }: { r: { atk: number; luck: number; eff: number; con: number } }) {
  return (
    <div className="space-y-2">
      <StatBar label="ATK" value={r.atk} color="bg-pink" />
      <StatBar label="LCK" value={r.luck} color="bg-lime" delay={80} />
      <StatBar label="EFF" value={r.eff} color="bg-amber" delay={160} />
      <StatBar label="CON" value={r.con} color="bg-violet-400" delay={240} />
    </div>
  );
}

export function ResultChip({ r }: { r: "W" | "L" | "T" }) {
  const c = r === "W" ? "bg-lime text-black" : r === "L" ? "bg-pink text-white" : "bg-slate-500 text-white";
  return <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${c}`}>{r}</span>;
}

export function StreakBadge({ type, n }: { type: "W" | "L" | "T" | null; n: number }) {
  if (!type || n < 2) return null;
  return type === "W" ? (
    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-300">🔥 W{n}</span>
  ) : type === "L" ? (
    <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-xs font-semibold text-sky-300">🥶 L{n}</span>
  ) : null;
}

/** Tug-of-war bar: share of combined points. */
export function TugBar({ a, b }: { a: number; b: number }) {
  const total = a + b;
  const pa = total > 0 ? Math.round((a / total) * 100) : 50;
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-black/40">
      <div className="fill bg-pink" style={{ width: `${pa}%` }} />
      <div className="fill bg-cyan" style={{ width: `${100 - pa}%`, transformOrigin: "right" }} />
    </div>
  );
}
