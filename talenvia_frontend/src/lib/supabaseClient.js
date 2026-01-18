import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client initialization for Talenvia.
 *
 * Uses CRA env vars:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_ANON_KEY
 *
 * This module is intentionally defensive:
 * - If env vars are missing, it exports `supabase = null` so the app can run without Supabase.
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
// Support both env var names:
// - container env list: REACT_APP_SUPABASE_KEY
// - older convention used in this repo: REACT_APP_SUPABASE_ANON_KEY
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || "";

/**
 * Supabase client instance (or null if not configured).
 * Keeping this as a module-level singleton avoids recreating clients.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Prefer persisting sessions so auth works as expected once you wire it into UI.
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

// PUBLIC_INTERFACE
export function isSupabaseConfigured() {
  /** Returns true when Supabase URL + anon key are present. */
  return Boolean(supabaseUrl && supabaseAnonKey);
}
