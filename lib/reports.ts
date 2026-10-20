import { League, teamName, Entry } from "./league";

export type Section = {
  heading: string;
  note?: string;
  columns: string[];
  rows: (string | number)[][];
};
export type Report = {
  slug: string;
  title: string;
  blurb: string;
  icon: string;
  build: (l: League) => Section[];
};

const f1 = (n: number) => n.toFixed(1);
const signed = (n: number) => (n > 0 ? `+${f1(n)}` : f1(n));

type Game = { week: number; winner: number | null; loser: number | null; wScore: number; lScore: number; home: number; away: number };

/** Completed, decided games, one row per matchup (ties dropped). */
function games(l: League): Game[] {
  return l.matchups
    .filter((m) => m.final && m.winner !== "TIE")
    .map((m) => {
      const homeWon = m.winner === "HOME";
      return {
        week: m.week,
        winner: homeWon ? m.home_team : m.away_team,
        loser: homeWon ? m.away_team : m.home_team,
        wScore: homeWon ? m.home_score : m.away_score,
        lScore: homeWon ? m.away_score : m.home_score,
        home: m.home_team,
        away: m.away_team,
      };
    });
}

const gameRow = (l: League, g: Game) => [
  g.week,
  teamName(l, g.winner!),
  f1(g.wScore),
  teamName(l, g.loser!),
  f1(g.lScore),
  f1(g.wScore - g.lScore),
];
const GAME_COLS = ["Wk", "Winner", "Score", "Loser", "Score", "Margin"];

// Starting requirements: QB, 2 RB, 2 WR, TE, FLEX (RB/WR/TE), D/ST, K.
const NEEDS: Record<string, number> = { QB: 1, RB: 2, WR: 2, TE: 1, "D/ST": 1, K: 1 };

function optimalScore(l: League, roster: Entry[]): number {
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

export const REPORTS: Report[] = [
  {
    slug: "blowouts",
    title: "Blowouts & nail-biters",
    blurb: "The most lopsided and the closest games of the season.",
    icon: "💥",
    build: (l) => {
      const g = games(l);
      const byMargin = [...g].sort((a, b) => b.wScore - b.lScore - (a.wScore - a.lScore));
      return [
        { heading: "Biggest blowouts", columns: GAME_COLS, rows: byMargin.slice(0, 8).map((x) => gameRow(l, x)) },
        { heading: "Closest games", columns: GAME_COLS, rows: byMargin.slice(-8).reverse().map((x) => gameRow(l, x)) },
      ];
    },
  },
  {
    slug: "heartbreakers",
    title: "Heartbreakers & steals",
    blurb: "Teams that scored big and still lost, and teams that squeaked by with almost nothing.",
    icon: "💔",
    build: (l) => {
      const g = games(l);
      return [
        {
          heading: "Highest-scoring losses",
          columns: ["Wk", "Team", "Scored", "Lost to", "Their score"],
          rows: [...g].sort((a, b) => b.lScore - a.lScore).slice(0, 8)
            .map((x) => [x.week, teamName(l, x.loser!), f1(x.lScore), teamName(l, x.winner!), f1(x.wScore)]),
        },
        {
          heading: "Lowest-scoring wins",
          columns: ["Wk", "Team", "Scored", "Beat", "Their score"],
          rows: [...g].sort((a, b) => a.wScore - b.wScore).slice(0, 8)
            .map((x) => [x.week, teamName(l, x.winner!), f1(x.wScore), teamName(l, x.loser!), f1(x.lScore)]),
        },
      ];
    },
  },
  {
    slug: "luck",
    title: "Luck index",
    blurb: "If every team played every other team each week, how many wins would you have? The gap versus your real record is luck.",
    icon: "🍀",
    build: (l) => {
      const scores = new Map<number, Map<number, number>>(); // week -> team -> score
      for (const m of l.matchups.filter((x) => x.final)) {
        const w = scores.get(m.week) ?? new Map();
        w.set(m.home_team, m.home_score);
        w.set(m.away_team, m.away_score);
        scores.set(m.week, w);
      }
      const t = new Map<number, { actual: number; expected: number; games: number }>();
      for (const m of l.matchups.filter((x) => x.final)) {
        const w = scores.get(m.week)!;
        for (const [id, won] of [
          [m.home_team, m.winner === "HOME" ? 1 : m.winner === "TIE" ? 0.5 : 0],
          [m.away_team, m.winner === "AWAY" ? 1 : m.winner === "TIE" ? 0.5 : 0],
        ] as [number, number][]) {
          const mine = w.get(id)!;
          const others = [...w.entries()].filter(([k]) => k !== id);
          const beat = others.filter(([, s]) => mine > s).length + others.filter(([, s]) => mine === s).length / 2;
          const r = t.get(id) ?? { actual: 0, expected: 0, games: 0 };
          r.actual += won;
          r.expected += beat / others.length;
          r.games++;
          t.set(id, r);
        }
      }
      const rows = [...t.entries()].map(([id, r]) => ({ id, ...r, luck: r.actual - r.expected }));
      return [
        {
          heading: "Actual wins vs expected wins",
          note: "Positive luck means you have more wins than your scoring deserves.",
          columns: ["Team", "Wins", "Expected wins", "Luck"],
          rows: rows.sort((a, b) => b.luck - a.luck).map((r) => [teamName(l, r.id), r.actual, f1(r.expected), signed(r.luck)]),
        },
      ];
    },
  },
  {
    slug: "bench",
    title: "Lineup efficiency",
    blurb: "How close each team came to its best possible lineup, and how many points were left on the bench.",
    icon: "🪑",
    build: (l) => {
      const finalWeeks = new Set(l.matchups.filter((m) => m.final).map((m) => m.week));
      const rosters = new Map<string, Entry[]>();
      for (const e of l.entries) {
        if (!finalWeeks.has(e.week)) continue;
        const k = `${e.week}:${e.team_id}`;
        rosters.set(k, [...(rosters.get(k) ?? []), e]);
      }
      const season = new Map<number, { actual: number; best: number }>();
      const weekly: { week: number; team: number; actual: number; best: number }[] = [];
      for (const [k, roster] of rosters) {
        const [week, team] = k.split(":").map(Number);
        const actual = roster.filter((e) => e.is_starter).reduce((a, e) => a + e.points, 0);
        const best = Math.max(actual, optimalScore(l, roster));
        weekly.push({ week, team, actual, best });
        const s = season.get(team) ?? { actual: 0, best: 0 };
        s.actual += actual;
        s.best += best;
        season.set(team, s);
      }
      return [
        {
          heading: "Season efficiency",
          columns: ["Team", "Points scored", "Best possible", "Left on bench", "Efficiency"],
          rows: [...season.entries()]
            .sort((a, b) => b[1].actual / b[1].best - a[1].actual / a[1].best)
            .map(([id, s]) => [teamName(l, id), f1(s.actual), f1(s.best), f1(s.best - s.actual), `${((s.actual / s.best) * 100).toFixed(1)}%`]),
        },
        {
          heading: "Costliest benching decisions (single week)",
          columns: ["Wk", "Team", "Scored", "Best possible", "Left on bench"],
          rows: [...weekly].sort((a, b) => b.best - b.actual - (a.best - a.actual)).slice(0, 8)
            .map((w) => [w.week, teamName(l, w.team), f1(w.actual), f1(w.best), f1(w.best - w.actual)]),
        },
      ];
    },
  },
  {
    slug: "players",
    title: "Player performances",
    blurb: "The best and worst single-game lines among players who were actually in a starting lineup.",
    icon: "🏈",
    build: (l) => {
      const finalWeeks = new Set(l.matchups.filter((m) => m.final).map((m) => m.week));
      const starters = l.entries.filter((e) => e.is_starter && finalWeeks.has(e.week));
      const row = (e: Entry) => [
        e.week,
        l.players.get(e.player_id)?.name ?? "?",
        l.players.get(e.player_id)?.position ?? "",
        teamName(l, e.team_id),
        f1(e.points),
      ];
      const cols = ["Wk", "Player", "Pos", "Started by", "Points"];
      return [
        { heading: "Best starter performances", columns: cols, rows: [...starters].sort((a, b) => b.points - a.points).slice(0, 10).map(row) },
        { heading: "Worst starter duds", columns: cols, rows: [...starters].sort((a, b) => a.points - b.points).slice(0, 10).map(row) },
      ];
    },
  },
];
