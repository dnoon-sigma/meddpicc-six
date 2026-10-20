import { publicClient, SEASON } from "./supabase";

export type Recap = { week: number; title: string | null; body: string; updated_at: string };

/** All recaps for the season, newest week first. */
export async function loadRecaps(): Promise<Recap[]> {
  const { data, error } = await publicClient()
    .from("recaps")
    .select("week,title,body,updated_at")
    .eq("season", SEASON)
    .order("week", { ascending: false });
  if (error) {
    console.error(`recaps: ${error.message}`);
    return [];
  }
  return data as Recap[];
}

/** Plain-text teaser for list cards: strips markdown markers and truncates. */
export function excerpt(body: string, max = 160): string {
  const text = body
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
