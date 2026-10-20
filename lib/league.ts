import { publicClient, SEASON } from "./supabase";

export type Team = { id: number; name: string; owner: string | null; abbrev: string | null };
export type Matchup = {
  week: number;
  home_team: number;
  away_team: number;
  home_score: number;
  away_score: number;
  winner: string;
  final: boolean;
};
export type Entry = {
  week: number;
  team_id: number;
  player_id: number;
  slot_id: number;
  is_starter: boolean;
  points: number;
  projected: number | null;
};
export type Player = { id: number; name: string; position: string | null };

export type League = {
  teams: Map<number, Team>;
  players: Map<number, Player>;
  matchups: Matchup[];
  entries: Entry[];
  lastSync: string | null;
  lastLive: string | null;
};

async function fetchAll<T>(table: string, columns: string, seasonFiltered = true): Promise<T[]> {
  const sb = publicClient();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(columns).range(from, from + 999);
    if (seasonFiltered) q = q.eq("season", SEASON);
    const { data, error } = await q;
    if (error) {
      console.error(`${table}: ${error.message}`);
      return rows;
    }
    rows.push(...(data as T[]));
    if (data.length < 1000) return rows;
  }
}

const num = (v: unknown) => Number(v ?? 0);

export async function loadLeague(): Promise<League> {
  const [teams, matchups, entries, players] = await Promise.all([
    fetchAll<Team>("teams", "id,name,owner,abbrev"),
    fetchAll<Matchup>("matchups", "week,home_team,away_team,home_score,away_score,winner,final"),
    fetchAll<Entry>("lineup_entries", "week,team_id,player_id,slot_id,is_starter,points,projected"),
    fetchAll<Player>("players", "id,name,position", false),
  ]);
  const { data: run } = await publicClient()
    .from("sync_runs")
    .select("created_at")
    .eq("status", "ok")
    .order("created_at", { ascending: false })
    .limit(1);
  const { data: live } = await publicClient()
    .from("sync_runs")
    .select("created_at")
    .in("kind", ["live", "live-tail"])
    .eq("status", "ok")
    .order("created_at", { ascending: false })
    .limit(1);
  return {
    teams: new Map(teams.map((t) => [t.id, t])),
    players: new Map(players.map((p) => [p.id, p])),
    matchups: matchups.map((m) => ({ ...m, home_score: num(m.home_score), away_score: num(m.away_score) })),
    entries: entries.map((e) => ({ ...e, points: num(e.points), projected: e.projected == null ? null : num(e.projected) })),
    lastSync: run?.[0]?.created_at ?? null,
    lastLive: live?.[0]?.created_at ?? null,
  };
}

export const teamName = (l: League, id: number) => l.teams.get(id)?.name ?? `Team ${id}`;

export type Standing = {
  id: number;
  wins: number;
  losses: number;
  ties: number;
  pf: number;
  pa: number;
  streak: string;
};

/** Standings from completed matchups only. */
export function standings(l: League): { throughWeek: number; rows: Standing[] } {
  const rows = new Map<number, Standing & { results: string[] }>();
  const get = (id: number) => {
    if (!rows.has(id)) rows.set(id, { id, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, streak: "-", results: [] });
    return rows.get(id)!;
  };
  for (const id of l.teams.keys()) get(id);
  const done = l.matchups.filter((m) => m.final).sort((a, b) => a.week - b.week);
  for (const m of done) {
    const h = get(m.home_team);
    const a = get(m.away_team);
    h.pf += m.home_score; h.pa += m.away_score;
    a.pf += m.away_score; a.pa += m.home_score;
    if (m.winner === "HOME") { h.wins++; a.losses++; h.results.push("W"); a.results.push("L"); }
    else if (m.winner === "AWAY") { a.wins++; h.losses++; a.results.push("W"); h.results.push("L"); }
    else { h.ties++; a.ties++; h.results.push("T"); a.results.push("T"); }
  }
  const out = [...rows.values()].map(({ results, ...s }) => {
    const last = results[results.length - 1];
    let n = 0;
    for (let i = results.length - 1; i >= 0 && results[i] === last; i--) n++;
    return { ...s, streak: last ? `${last}${n}` : "-" };
  });
  const pct = (s: Standing) => (s.wins + s.ties / 2) / Math.max(1, s.wins + s.losses + s.ties);
  out.sort((a, b) => pct(b) - pct(a) || b.pf - a.pf);
  return { throughWeek: Math.max(0, ...done.map((m) => m.week)), rows: out };
}
