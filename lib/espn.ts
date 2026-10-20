// Server-side only. ESPN's fantasy API is unofficial and blocks browser (CORS) calls.
export async function espnFetch(views: string[], params: Record<string, string | number> = {}) {
  const { ESPN_S2, ESPN_SWID, ESPN_LEAGUE_ID, ESPN_SEASON = "2026" } = process.env;
  const qs = new URLSearchParams();
  for (const v of views) qs.append("view", v);
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${ESPN_SEASON}/segments/0/leagues/${ESPN_LEAGUE_ID}?${qs}`;
  // Cookies are only needed for private leagues.
  const headers: Record<string, string> = {};
  if (ESPN_S2 && ESPN_SWID) headers.Cookie = `espn_s2=${ESPN_S2}; SWID=${ESPN_SWID}`;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return res.json();
}
