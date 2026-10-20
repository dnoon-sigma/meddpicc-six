import { createClient } from "@supabase/supabase-js";

export const SEASON = Number(process.env.ESPN_SEASON ?? 2026);

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Full-access client for the sync job. Server-side only. */
export function serviceClient() {
  return createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/** Read-only client (row-level security) for pages. */
export function publicClient() {
  return createClient(url(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
