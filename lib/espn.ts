// Server-side only. ESPN's fantasy API is unofficial and blocks browser (CORS) calls.
export async function espnFetch(view: string) {
  const { ESPN_S2, ESPN_SWID, ESPN_LEAGUE_ID, ESPN_SEASON = "2026" } = process.env;
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${ESPN_SEASON}/segments/0/leagues/${ESPN_LEAGUE_ID}?view=${view}`;
  // Cookies are only needed for private leagues.
  const headers: Record<string, string> = {};
  if (ESPN_S2 && ESPN_SWID) headers.Cookie = `espn_s2=${ESPN_S2}; SWID=${ESPN_SWID}`;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return res.json();
}

export type Standing = {
  id: number;
  name: string;
  owner: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
};

export async function getStandings(): Promise<{ week: number; standings: Standing[] }> {
  const data = await espnFetch("mTeam&view=mStandings");
  const owners = new Map<string, string>(
    (data.members ?? []).map((m: { id: string; displayName: string }) => [m.id, m.displayName]),
  );
  const standings: Standing[] = data.teams.map((t: any) => {
    const o = t.record.overall;
    return {
      id: t.id,
      name: t.name,
      owner: owners.get(t.primaryOwner) ?? "",
      wins: o.wins,
      losses: o.losses,
      ties: o.ties,
      pointsFor: o.pointsFor,
      pointsAgainst: o.pointsAgainst,
      streak: o.streakLength ? `${o.streakType === "WIN" ? "W" : "L"}${o.streakLength}` : "-",
    };
  });
  const pct = (s: Standing) => (s.wins + s.ties / 2) / Math.max(1, s.wins + s.losses + s.ties);
  standings.sort((a, b) => pct(b) - pct(a) || b.pointsFor - a.pointsFor);
  return { week: data.scoringPeriodId, standings };
}
