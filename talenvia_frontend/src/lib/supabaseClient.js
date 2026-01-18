import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client initialization for Talenvia.
 *
 * This is a React app (CRA-style env injection), so ONLY `REACT_APP_*` vars are available.
 *
 * Expected env vars:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * Backward compatibility:
 * - REACT_APP_SUPABASE_ANON_KEY (older convention)
 *
 * This module is intentionally defensive:
 * - If env vars are missing, it exports `supabase = null` so the app can run without Supabase.
 * - It also exports missing-env details for runtime UI warnings (toasts).
 */

// NOTE: Do NOT reference NEXT_PUBLIC_* here. Those are for Next.js, not this app.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";

// Prefer the container-defined name, but allow older convention used in this repo.
const supabaseKey =
  process.env.REACT_APP_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || "";

/**
 * Supabase client instance (or null if not configured).
 * Keeping this as a module-level singleton avoids recreating clients.
 */
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
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
  /** Returns true when Supabase URL + key are present. */
  return Boolean(supabaseUrl && supabaseKey);
}

// PUBLIC_INTERFACE
export function getSupabaseConfigStatus() {
  /**
   * Returns a small, serializable status object for UI/runtime guards.
   *
   * Returns:
   * - { configured: boolean, missing: string[] }
   */
  const missing = [];
  if (!supabaseUrl) missing.push("REACT_APP_SUPABASE_URL");
  if (!supabaseKey) missing.push("REACT_APP_SUPABASE_KEY (or REACT_APP_SUPABASE_ANON_KEY)");
  return { configured: missing.length === 0, missing };
}
