import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * Helpers around Supabase usage.
 * These are intentionally "safe by default":
 * - If Supabase isn't configured, they return { ok:false, reason:'not_configured' } (no throw).
 * - If a request fails, they return ok:false with an error summary (no throw).
 */

function safeTrim(value) {
  return String(value ?? "").trim();
}

function normalizeNullable(value) {
  const s = safeTrim(value);
  return s ? s : null;
}

// PUBLIC_INTERFACE
export async function insertUserRow({ name, email, phone_number, profile_photo_url }) {
  /**
   * Inserts a row into `public.users` and returns the inserted row.
   *
   * RLS notes:
   * - This function assumes an authenticated session if your policies require it.
   * - It does NOT set `id` so the DB can default it to UUID (gen_random_uuid()).
   * - If your RLS policy expects `id = auth.uid()` on insert, then the insert will fail unless:
   *   (a) the table's PK is `id = auth.uid()` (not default), or
   *   (b) you provide `id` explicitly, or
   *   (c) you use a server-side RPC/service role.
   *
   * Returns (safe-by-default, never throws):
   * - { ok: true, data: object }
   * - { ok: false, reason: 'not_configured' | 'error', error?: { message } }
   */
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const row = {
      name: safeTrim(name) || null,
      email: safeTrim(email) || null,
      phone_number: normalizeNullable(phone_number),
      profile_photo_url: normalizeNullable(profile_photo_url),
      // no `id` here on purpose (UUID default)
    };

    const { data, error } = await supabase.from("users").insert(row).select("*").single();

    if (error) {
      return { ok: false, reason: "error", error: { message: error.message } };
    }

    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      reason: "error",
      error: { message: e instanceof Error ? e.message : String(e) },
    };
  }
}

// PUBLIC_INTERFACE
export async function demoInsertUserRow() {
  /**
   * Minimal, opt-in demo function for manual testing.
   *
   * How to trigger:
   * - Open browser devtools console and run:
   *   `window.__talenviaDemoInsertUserRow?.()`
   *
   * This is intentionally NOT called automatically and does not change UI/routes.
   */
  const payload = {
    name: "Demo User",
    email: `demo+${Date.now()}@example.com`,
    phone_number: "555-0100",
    profile_photo_url: "https://placehold.co/128x128",
  };

  return insertUserRow(payload);
}

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
