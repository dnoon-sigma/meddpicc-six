import { espnFetch } from "./espn";
import { SEASON, serviceClient } from "./supabase";

const POSITIONS: Record<number, string> = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST" };
const BENCH = 20;
const IR = 21;

async function upsert(table: string, rows: object[], onConflict: string) {
  const sb = serviceClient();
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + 500), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

export async function currentWeek(): Promise<number> {
  const data = await espnFetch(["mTeam"]);
  return data.scoringPeriodId;
}

/** Pull one week's matchups and full lineups from ESPN and upsert them. Safe to re-run. */
export async function syncWeek(week: number) {
  const data = await espnFetch(["mTeam", "mBoxscore", "mMatchupScore"], { scoringPeriodId: week });

  const owners = new Map<string, string>(
    (data.members ?? []).map((m: any) => [m.id, m.displayName]),
  );
  await upsert(
    "teams",
    data.teams.map((t: any) => ({
      season: SEASON,
      id: t.id,
      name: t.name,
      abbrev: t.abbrev,
      owner: owners.get(t.primaryOwner) ?? null,
      logo: t.logo ?? null,
    })),
    "season,id",
  );

  const games = data.schedule.filter((m: any) => m.matchupPeriodId === week && m.home && m.away);
  const players = new Map<number, object>();
  const entries: object[] = [];

  for (const g of games) {
    for (const side of [g.home, g.away]) {
      for (const e of side.rosterForCurrentScoringPeriod?.entries ?? []) {
        const p = e.playerPoolEntry.player;
        players.set(p.id, {
          id: p.id,
          name: p.fullName,
          position: POSITIONS[p.defaultPositionId] ?? null,
          pro_team: p.proTeamId ?? null,
        });
        const projected = (p.stats ?? []).find(
          (s: any) => s.statSourceId === 1 && s.statSplitTypeId === 1 && s.scoringPeriodId === week,
        );
        entries.push({
          season: SEASON,
          week,
          team_id: side.teamId,
          player_id: p.id,
          slot_id: e.lineupSlotId,
          is_starter: e.lineupSlotId !== BENCH && e.lineupSlotId !== IR,
          points: e.playerPoolEntry.appliedStatTotal ?? 0,
          projected: projected?.appliedTotal ?? null,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  await upsert("players", [...players.values()], "id");
  await upsert(
    "matchups",
    games.map((g: any) => ({
      season: SEASON,
      week,
      home_team: g.home.teamId,
      away_team: g.away.teamId,
      home_score: g.home.totalPoints,
      away_score: g.away.totalPoints,
      winner: g.winner,
      final: g.winner !== "UNDECIDED",
      updated_at: new Date().toISOString(),
    })),
    "season,week,home_team",
  );
  await upsert("lineup_entries", entries, "season,week,team_id,player_id");

  return { week, matchups: games.length, lineupEntries: entries.length };
}

async function logRun(kind: string, week: number | null, status: string, message: string) {
  await serviceClient().from("sync_runs").insert({ kind, season: SEASON, week, status, message });
}

/** mode "backfill": weeks 1..current. mode "current": this week and last (to finalize it). */
export async function runSync(mode: "backfill" | "current") {
  const now = await currentWeek();
  const weeks =
    mode === "backfill"
      ? Array.from({ length: now }, (_, i) => i + 1)
      : [Math.max(1, now - 1), now];
  const results = [];
  try {
    for (const w of weeks) results.push(await syncWeek(w));
    await logRun(mode, now, "ok", `synced weeks ${weeks.join(", ")}`);
    return results;
  } catch (err) {
    await logRun(mode, now, "error", String(err));
    throw err;
  }
}
