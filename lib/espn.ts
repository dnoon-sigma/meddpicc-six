// Server-side only. ESPN's fantasy API is unofficial and blocks browser (CORS) calls.
export async function espnFetch(view: string) {
  const { ESPN_S2, ESPN_SWID, ESPN_LEAGUE_ID, ESPN_SEASON = "2026" } = process.env;
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${ESPN_SEASON}/segments/0/leagues/${ESPN_LEAGUE_ID}?view=${view}`;
  const res = await fetch(url, {
    headers: { Cookie: `espn_s2=${ESPN_S2}; SWID=${ESPN_SWID}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return res.json();
}
