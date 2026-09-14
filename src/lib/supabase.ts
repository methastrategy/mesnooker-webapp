import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client factory. Returns null when env vars are missing so the app
 * runs fully offline (local-only) without configuration. Realtime multiplayer
 * activates automatically once NEXT_PUBLIC_SUPABASE_URL + ANON_KEY are set.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: {
      params: { eventsPerSecond: 20 },
    },
  });
}

let cached: SupabaseClient | null | undefined;

export function getSupabaseCached(): SupabaseClient | null {
  if (cached === undefined) cached = getSupabase();
  return cached;
}

export function supabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}