import { runLive, runSync } from "@/lib/sync";

export const maxDuration = 60;

// ?mode=live is called every 5 minutes by Supabase pg_cron. Vercel cron sends `Authorization: Bearer $CRON_SECRET`. Use ?mode=backfill to load every week so far.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const params = new URL(req.url).searchParams;
  try {
    if (params.get("mode") === "live") {
      return Response.json({ mode: "live", ...(await runLive(params.get("force") === "1")) });
    }
    const mode = params.get("mode") === "backfill" ? "backfill" : "current";
    return Response.json({ mode, results: await runSync(mode) });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
