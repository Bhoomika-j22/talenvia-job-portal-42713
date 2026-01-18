import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * Helpers around Supabase usage.
 * These are intentionally "safe by default":
 * - If Supabase isn't configured, they return { ok:false, reason:'not_configured' } (no throw).
 * - If a request fails, they return ok:false with an error summary (no throw).
 */

// PUBLIC_INTERFACE
export async function supabaseHealthCheck() {
  /**
   * Performs a minimal Supabase check.
   *
   * We try to read the current auth session. This does not require DB tables
   * and should work for any Supabase project with Auth enabled.
   *
   * Returns:
   * - { ok: true, configured: true, hasSession: boolean }
   * - { ok: false, configured: false, reason: 'not_configured' }
   * - { ok: false, configured: true, reason: 'error', error: { message } }
   */
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, configured: false, reason: "not_configured" };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, configured: true, reason: "error", error: { message: error.message } };
    }
    return { ok: true, configured: true, hasSession: Boolean(data?.session) };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      reason: "error",
      error: { message: e instanceof Error ? e.message : String(e) },
    };
  }
}

// PUBLIC_INTERFACE
export async function fetchDemoRows(tableName = "demo") {
  /**
   * Optional demo helper: attempts to fetch a few rows from a given table.
   * This is purely a scaffold and should not be relied upon by app features.
   *
   * Returns:
   * - { ok: true, rows: any[] }
   * - { ok: false, reason: 'not_configured' | 'error', error?: { message } }
   */
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(3);
    if (error) {
      return { ok: false, reason: "error", error: { message: error.message } };
    }
    return { ok: true, rows: Array.isArray(data) ? data : [] };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      error: { message: e instanceof Error ? e.message : String(e) },
    };
  }
}
