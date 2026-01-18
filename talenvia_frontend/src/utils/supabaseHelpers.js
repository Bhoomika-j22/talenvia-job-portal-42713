import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * Helpers around Supabase usage.
 * These are intentionally "safe by default":
 * - If Supabase isn't configured, they return { ok:false, reason:'not_configured' } (no throw).
 * - If a request fails, they return ok:false with an error summary (no throw).
 *
 * Some helpers (like ensureUserRow) are intentionally strict and WILL throw:
 * those are meant to be used by auth flows and higher-level code that wants to
 * fail fast and surface explicit errors.
 */

function safeTrim(value) {
  return String(value ?? "").trim();
}

function normalizeNullable(value) {
  const s = safeTrim(value);
  return s ? s : null;
}

// PUBLIC_INTERFACE
export async function ensureUserRow(userPatch = {}) {
  /**
   * Ensures a `public.users` row exists for the *currently authenticated* user
   * and returns the inserted/updated row.
   *
   * RLS + schema expectations for this project:
   * - `public.users.id uuid primary key default auth.uid()`
   * - RLS allows CRUD only when `id = auth.uid()`
   *
   * Behavior:
   * - Requires an active authenticated session (throws if missing).
   * - First tries to SELECT the user's row.
   * - If missing, INSERTS a new row (omits `id` so DEFAULT auth.uid() is used).
   * - If present, UPDATES allowed fields and bumps `updated_at` when provided by schema.
   * - Always returns the resulting row using `.select("*").single()`.
   *
   * Note: This function throws on any misconfiguration/auth/database error so callers
   * can decide how to handle it (toast, retry, redirect, etc).
   */
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Supabase not configured (missing REACT_APP_SUPABASE_URL/KEY).");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Failed to read Supabase session: ${sessionError.message}`);
  }

  const session = sessionData?.session;
  if (!session?.user?.id) {
    // Must be called only AFTER successful auth; required for auth.uid() RLS checks.
    throw new Error("No authenticated Supabase session. Call ensureUserRow after login/signup.");
  }

  const uid = session.user.id;

  // Map patch fields into DB columns we know exist in this project.
  const basePayload = {
    name: normalizeNullable(userPatch.name),
    email: normalizeNullable(userPatch.email ?? session.user.email),
    phone_number: normalizeNullable(userPatch.phone_number ?? userPatch.phone),
    profile_photo_url: normalizeNullable(userPatch.profile_photo_url),
  };

  // Remove undefined keys so we don't unintentionally overwrite columns with null.
  const cleanedPayload = Object.fromEntries(
    Object.entries(basePayload).filter(([, v]) => v !== undefined)
  );

  // 1) Try to read existing row
  const { data: existingRow, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  // Under RLS, a missing policy can present as select error. Bubble it up explicitly.
  if (selectError) {
    throw new Error(`Failed to read user row (RLS?): ${selectError.message}`);
  }

  // 2) Insert if missing
  if (!existingRow) {
    const insertRow = {
      ...cleanedPayload,
      // IMPORTANT: omit `id` so DEFAULT auth.uid() populates it (matches RLS WITH CHECK).
      // Timestamps: prefer server-side defaults/triggers; provide updated_at only if schema expects it.
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert(insertRow)
      .select("*")
      .single();

    if (insertError) {
      throw new Error(`Failed to insert user row: ${insertError.message}`);
    }

    return inserted;
  }

  // 3) Update existing row (avoid id changes; keep it strictly self-owned)
  const updateRow = {
    ...cleanedPayload,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update(updateRow)
    .eq("id", uid)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(`Failed to update user row: ${updateError.message}`);
  }

  return updated;
}

// PUBLIC_INTERFACE
export async function insertUserRow({ name, email, phone_number, profile_photo_url }) {
  /**
   * Inserts a row into `public.users` and returns the inserted row.
   *
   * RLS notes (current Talenvia setup):
   * - `public.users.id` defaults to `auth.uid()`
   * - RLS policy enforces `WITH CHECK (id = auth.uid())` on INSERT
   *
   * Therefore:
   * - You MUST be authenticated
   * - You SHOULD omit `id` and let the database populate it with `auth.uid()`
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
      // IMPORTANT: omit `id` so it defaults to auth.uid()
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
export async function upsertOwnUserRow({ name, email }) {
  /**
   * Recommended way to "create profile row if missing, otherwise update".
   *
   * This calls the Postgres function:
   * - public.talenvia_upsert_own_user(p_name text, p_email text)
   *
   * Returns:
   * - { ok: true, data: object }  // the users row
   * - { ok: false, reason: 'not_configured' | 'error', error?: { message } }
   */
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const { data, error } = await supabase.rpc("talenvia_upsert_own_user", {
      p_name: safeTrim(name) || null,
      p_email: safeTrim(email) || null,
    });

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
