import { espnFetch } from "@/lib/espn";

export async function GET() {
  const data = await espnFetch(["mTeam"]);
  return Response.json({ teams: data.teams?.length ?? 0 });
}
