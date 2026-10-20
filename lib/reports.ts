import { League, teamName, Entry } from "./league";
import { computeTeamStats, weeklyEfficiency } from "./stats";

export type Section = {
  heading: string;
  note?: string;
  ranked?: boolean; // show 🥇🥈🥉 for the first rows
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
        { heading: "Biggest blowouts",
          ranked: true, columns: GAME_COLS, rows: byMargin.slice(0, 8).map((x) => gameRow(l, x)) },
        { heading: "Closest games",
          ranked: true, columns: GAME_COLS, rows: byMargin.slice(-8).reverse().map((x) => gameRow(l, x)) },
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
          ranked: true,
          columns: ["Wk", "Team", "Scored", "Lost to", "Their score"],
          rows: [...g].sort((a, b) => b.lScore - a.lScore).slice(0, 8)
            .map((x) => [x.week, teamName(l, x.loser!), f1(x.lScore), teamName(l, x.winner!), f1(x.wScore)]),
        },
        {
          heading: "Lowest-scoring wins",
          ranked: true,
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
      const rows = [...computeTeamStats(l).values()].filter((t) => t.weekly.length);
      return [
        {
          heading: "Actual wins vs expected wins",
          note: "Positive luck means you have more wins than your scoring deserves.",
          ranked: true,
          columns: ["Team", "Wins", "Expected wins", "Luck"],
          rows: rows.sort((a, b) => b.luck - a.luck).map((t) => [teamName(l, t.id), t.wins + t.ties / 2, f1(t.expected), signed(t.luck)]),
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
      const season = [...computeTeamStats(l).values()].filter((t) => t.bestPts > 0);
      return [
        {
          heading: "Season efficiency",
          ranked: true,
          columns: ["Team", "Points scored", "Best possible", "Left on bench", "Efficiency"],
          rows: season
            .sort((a, b) => b.efficiency - a.efficiency)
            .map((t) => [teamName(l, t.id), f1(t.actualPts), f1(t.bestPts), f1(t.bestPts - t.actualPts), `${(t.efficiency * 100).toFixed(1)}%`]),
        },
        {
          heading: "Costliest benching decisions (single week)",
          ranked: true,
          columns: ["Wk", "Team", "Scored", "Best possible", "Left on bench"],
          rows: weeklyEfficiency(l)
            .sort((a, b) => b.best - b.actual - (a.best - a.actual))
            .slice(0, 8)
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
        { heading: "Best starter performances",
          ranked: true, columns: cols, rows: [...starters].sort((a, b) => b.points - a.points).slice(0, 10).map(row) },
        { heading: "Worst starter duds",
          ranked: true, columns: cols, rows: [...starters].sort((a, b) => a.points - b.points).slice(0, 10).map(row) },
      ];
    },
  },
];
