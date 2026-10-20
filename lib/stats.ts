import { League, Entry, teamName } from "./league";

// Starting requirements: QB, 2 RB, 2 WR, TE, FLEX (RB/WR/TE), D/ST, K.
const NEEDS: Record<string, number> = { QB: 1, RB: 2, WR: 2, TE: 1, "D/ST": 1, K: 1 };

export function optimalScore(l: League, roster: Entry[]): number {
  const byPos = new Map<string, number[]>();
  for (const e of roster) {
    if (e.slot_id === 21) continue; // IR players can't be started
    const pos = l.players.get(e.player_id)?.position;
    if (!pos) continue;
    byPos.set(pos, [...(byPos.get(pos) ?? []), e.points]);
  }
  let total = 0;
  const flexPool: number[] = [];
  for (const [pos, need] of Object.entries(NEEDS)) {
    const sorted = (byPos.get(pos) ?? []).sort((a, b) => b - a);
    total += sorted.slice(0, need).reduce((a, b) => a + b, 0);
    if (pos === "RB" || pos === "WR" || pos === "TE") flexPool.push(...sorted.slice(need));
  }
  return total + (flexPool.sort((a, b) => b - a)[0] ?? 0);
}

export type WeekEff = { week: number; team: number; actual: number; best: number };

/** Actual vs best-possible lineup for every team in every completed week. */
export function weeklyEfficiency(l: League): WeekEff[] {
  const finalWeeks = new Set(l.matchups.filter((m) => m.final).map((m) => m.week));
  const rosters = new Map<string, Entry[]>();
  for (const e of l.entries) {
    if (!finalWeeks.has(e.week)) continue;
    const k = `${e.week}:${e.team_id}`;
    rosters.set(k, [...(rosters.get(k) ?? []), e]);
  }
  return [...rosters].map(([k, roster]) => {
    const [week, team] = k.split(":").map(Number);
    const actual = roster.filter((e) => e.is_starter).reduce((a, e) => a + e.points, 0);
    return { week, team, actual, best: Math.max(actual, optimalScore(l, roster)) };
  });
}

export type Badge = { icon: string; label: string; blurb: string };
export type Ratings = { atk: number; luck: number; eff: number; con: number; ovr: number };
export type TeamStats = {
  id: number;
  wins: number;
  losses: number;
  ties: number;
  pf: number;
  pa: number;
  weekly: { week: number; score: number; oppScore: number; oppId: number; result: "W" | "L" | "T" }[];
  expected: number;
  luck: number;
  actualPts: number;
  bestPts: number;
  efficiency: number;
  stdev: number;
  streak: { type: "W" | "L" | "T" | null; n: number };
  ratings: Ratings;
  badges: Badge[];
};

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export function computeTeamStats(l: League): Map<number, TeamStats> {
  const finals = l.matchups.filter((m) => m.final).sort((a, b) => a.week - b.week);
  const weekScores = new Map<number, Map<number, number>>();
  for (const m of finals) {
    const w = weekScores.get(m.week) ?? new Map<number, number>();
    w.set(m.home_team, m.home_score);
    w.set(m.away_team, m.away_score);
    weekScores.set(m.week, w);
  }

  const out = new Map<number, TeamStats>();
  const ensure = (id: number) => {
    if (!out.has(id)) {
      out.set(id, {
        id, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, weekly: [], expected: 0, luck: 0,
        actualPts: 0, bestPts: 0, efficiency: 0, stdev: 0, streak: { type: null, n: 0 },
        ratings: { atk: 75, luck: 75, eff: 75, con: 75, ovr: 75 }, badges: [],
      });
    }
    return out.get(id)!;
  };
  for (const id of l.teams.keys()) ensure(id);

  for (const m of finals) {
    const sides: [number, number, number, number][] = [
      [m.home_team, m.away_team, m.home_score, m.away_score],
      [m.away_team, m.home_team, m.away_score, m.home_score],
    ];
    for (const [id, oppId, score, oppScore] of sides) {
      const t = ensure(id);
      const result = score > oppScore ? "W" : score < oppScore ? "L" : "T";
      t.weekly.push({ week: m.week, score, oppScore, oppId, result });
      t.pf += score;
      t.pa += oppScore;
      if (result === "W") t.wins++;
      else if (result === "L") t.losses++;
      else t.ties++;
      const others = [...weekScores.get(m.week)!].filter(([k]) => k !== id);
      const beat = others.filter(([, s]) => score > s).length + others.filter(([, s]) => score === s).length / 2;
      t.expected += beat / others.length;
    }
  }

  for (const e of weeklyEfficiency(l)) {
    const t = ensure(e.team);
    t.actualPts += e.actual;
    t.bestPts += e.best;
  }

  for (const t of out.values()) {
    t.luck = t.wins + t.ties / 2 - t.expected;
    t.efficiency = t.bestPts ? t.actualPts / t.bestPts : 0;
    const scores = t.weekly.map((w) => w.score);
    const avg = mean(scores);
    t.stdev = Math.sqrt(mean(scores.map((s) => (s - avg) ** 2)));
    const last = t.weekly[t.weekly.length - 1]?.result ?? null;
    let n = 0;
    for (let i = t.weekly.length - 1; i >= 0 && t.weekly[i].result === last; i--) n++;
    t.streak = { type: last, n: last ? n : 0 };
  }

  // Ratings: scale each attribute across the league to 50-99 (like a video game).
  const played = [...out.values()].filter((t) => t.weekly.length > 0);
  const scale = (get: (t: TeamStats) => number, invert = false) => {
    const vals = played.map(get);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return (t: TeamStats) => {
      if (hi === lo || !t.weekly.length) return 75;
      const x = (get(t) - lo) / (hi - lo);
      return Math.round(50 + 49 * (invert ? 1 - x : x));
    };
  };
  const rAtk = scale((t) => t.pf / t.weekly.length);
  const rLuck = scale((t) => t.luck);
  const rEff = scale((t) => t.efficiency);
  const rCon = scale((t) => t.stdev, true);
  for (const t of out.values()) {
    const r = { atk: rAtk(t), luck: rLuck(t), eff: rEff(t), con: rCon(t) };
    t.ratings = { ...r, ovr: Math.round(mean([r.atk, r.atk, r.eff, r.con])) };
  }

  // Badges: each goes to exactly one team.
  const give = (
    pick: (t: TeamStats) => number,
    dir: "max" | "min",
    badge: Badge,
    ok: (t: TeamStats) => boolean = () => true,
  ) => {
    const pool = played.filter(ok);
    if (!pool.length) return;
    const best = pool.reduce((a, b) => (dir === "max" ? (pick(b) > pick(a) ? b : a) : pick(b) < pick(a) ? b : a));
    best.badges.push(badge);
  };
  give((t) => t.wins + t.ties / 2 - t.losses, "max", { icon: "👑", label: "Top Dog", blurb: "Best record in the league" });
  give((t) => t.pf, "max", { icon: "🚀", label: "Points Machine", blurb: "Most points scored" });
  give((t) => t.pa, "min", { icon: "🛡️", label: "Brick Wall", blurb: "Fewest points allowed" });
  give((t) => t.luck, "max", { icon: "🍀", label: "Four-Leaf Clover", blurb: "Luckiest team: more wins than the scoring deserves" });
  give((t) => t.luck, "min", { icon: "🌧️", label: "Cursed", blurb: "Unluckiest team: fewer wins than the scoring deserves" });
  give((t) => t.efficiency, "max", { icon: "🎯", label: "Lineup Genius", blurb: "Most efficient lineup setting" });
  give((t) => t.efficiency, "min", { icon: "🪑", label: "Benchwarmer", blurb: "Leaves the most points on the bench" });
  give((t) => t.stdev, "max", { icon: "🎢", label: "Rollercoaster", blurb: "Most up-and-down weekly scores" });
  give((t) => t.stdev, "min", { icon: "🧱", label: "Steady Eddie", blurb: "Most consistent weekly scores" });
  give((t) => t.streak.n, "max", { icon: "🔥", label: "On Fire", blurb: "Longest active winning streak" }, (t) => t.streak.type === "W" && t.streak.n >= 2);
  give((t) => t.streak.n, "max", { icon: "🥶", label: "Ice Cold", blurb: "Longest active losing streak" }, (t) => t.streak.type === "L" && t.streak.n >= 2);

  return out;
}

export type Award = { icon: string; title: string; who: string; detail: string; teamId?: number; href?: string };

/** Fun awards for one completed week. */
export function weekAwards(l: League, week: number): Award[] {
  const games = l.matchups.filter((m) => m.week === week && m.final);
  if (!games.length) return [];
  const scores = games.flatMap((m) => [
    { id: m.home_team, s: m.home_score },
    { id: m.away_team, s: m.away_score },
  ]);
  const hi = scores.reduce((a, b) => (b.s > a.s ? b : a));
  const lo = scores.reduce((a, b) => (b.s < a.s ? b : a));
  const margin = (m: (typeof games)[number]) => Math.abs(m.home_score - m.away_score);
  const blow = games.reduce((a, b) => (margin(b) > margin(a) ? b : a));
  const close = games.reduce((a, b) => (margin(b) < margin(a) ? b : a));
  const winnerOf = (m: (typeof games)[number]) => (m.home_score >= m.away_score ? m.home_team : m.away_team);
  const loserOf = (m: (typeof games)[number]) => (m.home_score >= m.away_score ? m.away_team : m.home_team);
  const awards: Award[] = [
    { icon: "🏆", title: "High Score", who: teamName(l, hi.id), detail: `${hi.s.toFixed(1)} pts`, teamId: hi.id },
    { icon: "🧊", title: "Cold Shoulder", who: teamName(l, lo.id), detail: `${lo.s.toFixed(1)} pts`, teamId: lo.id },
    { icon: "💥", title: "Demolition", who: teamName(l, winnerOf(blow)), detail: `beat ${teamName(l, loserOf(blow))} by ${margin(blow).toFixed(1)}`, teamId: winnerOf(blow) },
    { icon: "😬", title: "Nail-Biter", who: teamName(l, winnerOf(close)), detail: `edged ${teamName(l, loserOf(close))} by ${margin(close).toFixed(1)}`, teamId: winnerOf(close) },
  ];
  const blunder = weeklyEfficiency(l).filter((e) => e.week === week).sort((a, b) => b.best - b.actual - (a.best - a.actual))[0];
  if (blunder) {
    awards.push({ icon: "🪑", title: "Bench Blunder", who: teamName(l, blunder.team), detail: `left ${(blunder.best - blunder.actual).toFixed(1)} pts on the bench`, teamId: blunder.team });
  }
  const star = l.entries.filter((e) => e.week === week && e.is_starter).sort((a, b) => b.points - a.points)[0];
  if (star) {
    awards.push({ icon: "⭐", title: "Player of the Week", who: l.players.get(star.player_id)?.name ?? "?", detail: `${star.points.toFixed(1)} pts for ${teamName(l, star.team_id)}`, teamId: star.team_id });
  }
  return awards;
}

export type Inmate = {
  teamId: number;
  players: { name: string; position: string; reason: "BYE" | "OUT" }[];
  priors: number; // times the team was in jail in earlier weeks this season
};

/**
 * Teams that started someone who didn't play in a completed week.
 * Skill players (QB/RB/WR/TE) count when they recorded no stats; K and D/ST only count on a bye,
 * since a kicker can legitimately have an empty stat line.
 */
export function jail(l: League): { week: number | null; inmates: Inmate[]; totalPriors: number } {
  const finalWeeks = [...new Set(l.matchups.filter((m) => m.final).map((m) => m.week))].sort((a, b) => a - b);
  const week = finalWeeks[finalWeeks.length - 1] ?? null;
  if (week === null) return { week, inmates: [], totalPriors: 0 };

  const offenders = (w: number) => {
    const byTeam = new Map<number, Inmate["players"]>();
    for (const e of l.entries) {
      if (e.week !== w || !e.is_starter || e.played === null) continue;
      const p = l.players.get(e.player_id);
      const pos = p?.position ?? "";
      const skill = ["QB", "RB", "WR", "TE"].includes(pos);
      const nope = skill ? !e.played : !!e.on_bye;
      if (!nope) continue;
      byTeam.set(e.team_id, [
        ...(byTeam.get(e.team_id) ?? []),
        { name: p?.name ?? "Unknown", position: pos, reason: e.on_bye ? "BYE" : "OUT" },
      ]);
    }
    return byTeam;
  };

  const priors = new Map<number, number>();
  for (const w of finalWeeks.filter((x) => x < week)) {
    for (const id of offenders(w).keys()) priors.set(id, (priors.get(id) ?? 0) + 1);
  }
  const inmates = [...offenders(week)].map(([teamId, players]) => ({ teamId, players, priors: priors.get(teamId) ?? 0 }));
  inmates.sort((a, b) => b.players.length - a.players.length || b.priors - a.priors);
  return { week, inmates, totalPriors: [...priors.values()].reduce((a, b) => a + b, 0) };
}
