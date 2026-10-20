import { runSync } from "@/lib/sync";

export const maxDuration = 60;

// Vercel cron sends `Authorization: Bearer $CRON_SECRET`. Use ?mode=backfill to load every week so far.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const mode = new URL(req.url).searchParams.get("mode") === "backfill" ? "backfill" : "current";
  try {
    return Response.json({ mode, results: await runSync(mode) });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
