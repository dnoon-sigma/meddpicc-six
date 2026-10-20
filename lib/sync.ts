import { espnFetch } from "./espn";
import { SEASON, serviceClient } from "./supabase";

const POSITIONS: Record<number, string> = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST" };
const SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
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

/** NFL team ids (same ids ESPN fantasy uses as proTeamId) that are on bye in a given week. */
async function teamsOnBye(week: number): Promise<Set<number>> {
  const res = await fetch(`${SCOREBOARD}?week=${week}&seasontype=2&dates=${SEASON}`, { cache: "no-store" });
  if (!res.ok) return new Set();
  const data = await res.json();
  return new Set((data.teamsOnBye ?? []).map((t: any) => Number(t.id)));
}

/** Pull one week's matchups and full lineups from ESPN and upsert them. Safe to re-run. */
export async function syncWeek(week: number) {
  const data = await espnFetch(["mTeam", "mBoxscore", "mMatchupScore"], { scoringPeriodId: week });
  const byes = await teamsOnBye(week);

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
        // A player who played has a non-empty actual stat line for the week; a bye/inactive player does not.
        const actual = (p.stats ?? []).find(
          (s: any) => s.statSourceId === 0 && s.statSplitTypeId === 1 && s.scoringPeriodId === week,
        );
        const played = !!actual && Object.keys(actual.stats ?? {}).length > 0;
        entries.push({
          season: SEASON,
          week,
          team_id: side.teamId,
          player_id: p.id,
          slot_id: e.lineupSlotId,
          is_starter: e.lineupSlotId !== BENCH && e.lineupSlotId !== IR,
          points: e.playerPoolEntry.appliedStatTotal ?? 0,
          projected: projected?.appliedTotal ?? null,
          played,
          on_bye: byes.has(p.proTeamId),
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
    await pruneLiveRuns();
    return results;
  } catch (err) {
    await logRun(mode, now, "error", String(err));
    throw err;
  }
}


async function nflGameLive(): Promise<boolean> {
  const res = await fetch(SCOREBOARD, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`);
  const data = await res.json();
  return (data.events ?? []).some((e: any) => e.status?.type?.state === "in");
}

/**
 * Called every 5 minutes by Supabase. Syncs the current week only while an NFL game is in progress,
 * plus one 30-minute tail after the last live sync to catch the final stat updates. Otherwise a no-op.
 */
export async function runLive(force = false) {
  let kind = "live";
  if (!force && !(await nflGameLive())) {
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data } = await serviceClient()
      .from("sync_runs").select("id").eq("kind", "live").eq("status", "ok").gte("created_at", since).limit(1);
    if (!data?.length) return { skipped: true };
    kind = "live-tail";
  }
  const week = await currentWeek();
  try {
    const result = await syncWeek(week);
    await logRun(kind, week, "ok", `synced week ${week}`);
    return { skipped: false, kind, ...result };
  } catch (err) {
    await logRun(kind, week, "error", String(err));
    throw err;
  }
}

/** Live runs are only useful for a few days; keep the log small. */
export async function pruneLiveRuns() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await serviceClient().from("sync_runs").delete().in("kind", ["live", "live-tail"]).lt("created_at", cutoff);
}
