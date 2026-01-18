import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * Basic profile persistence focused on fields that must map to `public.users`.
 *
 * Important schema notes for this repo (see /assets/supabase.md):
 * - public.users is keyed by `id uuid primary key default auth.uid()`
 * - Under RLS, user can CRUD only where `id = auth.uid()`
 *
 * This module therefore:
 * - Requires an authenticated session before any writes
 * - Omits `id` on insert/upsert unless explicitly required as a fallback
 *
 * Location handling:
 * - Some Supabase schemas may not include users.location.
 * - In that case we persist location into `career_preferences.preferred_location` and also read it back from there.
 */

function safeTrim(value) {
  return String(value ?? "").trim();
}

function normalizeNullable(value) {
  const s = safeTrim(value);
  return s ? s : null;
}

function serializeSupabaseError(error) {
  // Supabase errors often have non-enumerable fields; build a robust JSON summary for logs/toasts.
  if (!error) return null;
  return {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  };
}

async function getAuthSessionOrReason() {
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, reason: "auth_error", error: serializeSupabaseError(error) };
    }
    const session = data?.session;
    if (!session?.user?.id) return { ok: false, reason: "no_session" };
    return { ok: true, session };
  } catch (e) {
    return { ok: false, reason: "auth_error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

/**
 * Detect whether `public.users` has a `location` column.
 * We do a minimal SELECT of `location` for the current user; if PostgREST complains about missing column,
 * we treat it as "not supported" and fallback to career_preferences.preferred_location.
 */
async function usersHasLocationColumn(uid) {
  try {
    const { error } = await supabase.from("users").select("location").eq("id", uid).maybeSingle();
    if (!error) return true;

    const msg = String(error.message || "");
    if (msg.toLowerCase().includes("column") && msg.toLowerCase().includes("location")) {
      return false;
    }
    // Unknown error: don't assume the column exists; let callers continue via fallback.
    return false;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export async function upsertUserBasicProfile({ name, email, phone_number, profile_photo_url, location }) {
  /**
   * Upserts the current user's basic fields into `public.users`.
   *
   * Behavior:
   * - Requires an authenticated session (one-time check) before writes.
   * - Tries upsert WITHOUT id first (relying on default auth.uid()).
   * - If upsert fails (common due to RLS + upsert needing conflict target), retries with explicit `id = auth.uid()`.
   * - Maps:
   *   - name -> users.name
   *   - email -> users.email
   *   - phone_number -> users.phone_number
   *   - profile_photo_url -> users.profile_photo_url
   *   - location -> users.location if column exists; otherwise upserts to career_preferences.preferred_location
   *
   * Returns (safe-by-default):
   * - { ok: true, data: row, usedLocationFallback: boolean }
   * - { ok: false, reason: 'not_configured'|'no_session'|'error', error?: object }
   */
  const sessionRes = await getAuthSessionOrReason();
  if (!sessionRes.ok) return sessionRes;

  const uid = sessionRes.session.user.id;

  const basePayload = {
    name: normalizeNullable(name),
    email: normalizeNullable(email ?? sessionRes.session.user.email),
    phone_number: normalizeNullable(phone_number),
    profile_photo_url: normalizeNullable(profile_photo_url),
    updated_at: new Date().toISOString(),
  };

  // Remove undefined keys only; keep nulls when user explicitly clears a value.
  const cleanedBase = Object.fromEntries(Object.entries(basePayload).filter(([, v]) => v !== undefined));

  let usedLocationFallback = false;
  const hasUsersLocation = await usersHasLocationColumn(uid);

  const userPayload = {
    ...cleanedBase,
    ...(hasUsersLocation ? { location: normalizeNullable(location) } : {}),
  };

  // 1) Try upsert without id (preferred: relies on DEFAULT auth.uid()).
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert(userPayload, { onConflict: "id" })
      .select("*")
      .single();

    if (!error) {
      // If users.location isn't supported, persist location into career_preferences.
      if (!hasUsersLocation && safeTrim(location)) {
        const prefRes = await upsertPreferredLocation(uid, location);
        if (!prefRes.ok) return prefRes;
        usedLocationFallback = true;
      }
      return { ok: true, data, usedLocationFallback };
    }

    // Retry with explicit id = auth.uid()
    const retryPayload = { ...userPayload, id: uid };
    const { data: retryData, error: retryError } = await supabase
      .from("users")
      .upsert(retryPayload, { onConflict: "id" })
      .select("*")
      .single();

    if (retryError) {
      return { ok: false, reason: "error", error: serializeSupabaseError(retryError) };
    }

    if (!hasUsersLocation && safeTrim(location)) {
      const prefRes = await upsertPreferredLocation(uid, location);
      if (!prefRes.ok) return prefRes;
      usedLocationFallback = true;
    }

    return { ok: true, data: retryData, usedLocationFallback };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

async function upsertPreferredLocation(uid, location) {
  // Keep behavior consistent with existing persistence: career_preferences is per-user.
  // If row exists: update; else insert. Under RLS, user_id must match auth.uid().
  try {
    const preferred_location = normalizeNullable(location);

    // Try update first (cheap and avoids overwriting other preference fields).
    const { data: updated, error: updateError } = await supabase
      .from("career_preferences")
      .update({ preferred_location, updated_at: new Date().toISOString() })
      .eq("user_id", uid)
      .select("id,user_id,preferred_location")
      .maybeSingle();

    if (!updateError && updated) return { ok: true };

    // If update failed because no row exists, insert.
    const { error: insertError } = await supabase.from("career_preferences").insert({
      user_id: uid,
      preferred_location,
    });

    if (insertError) return { ok: false, reason: "error", error: serializeSupabaseError(insertError) };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function loadUserBasicProfile() {
  /**
   * Loads basic profile fields for the current user from `public.users`.
   * If `users.location` doesn't exist, also loads location from `career_preferences.preferred_location`.
   *
   * Returns:
   * - { ok:true, data:{ name,email,phone_number,profile_photo_url,location }, usedLocationFallback:boolean }
   * - { ok:false, reason:'not_configured'|'no_session'|'error', error?:object }
   */
  const sessionRes = await getAuthSessionOrReason();
  if (!sessionRes.ok) return sessionRes;

  const uid = sessionRes.session.user.id;

  try {
    // Always read fields that we know exist per repo expectations.
    const { data: userRow, error } = await supabase
      .from("users")
      .select("id,name,email,phone_number,profile_photo_url")
      .eq("id", uid)
      .maybeSingle();

    if (error) return { ok: false, reason: "error", error: serializeSupabaseError(error) };

    const hasUsersLocation = await usersHasLocationColumn(uid);

    let location = null;
    let usedLocationFallback = false;

    if (hasUsersLocation) {
      const { data: locRow, error: locError } = await supabase.from("users").select("location").eq("id", uid).maybeSingle();
      if (!locError) location = locRow?.location ?? null;
    } else {
      const { data: prefRow, error: prefError } = await supabase
        .from("career_preferences")
        .select("preferred_location")
        .eq("user_id", uid)
        .maybeSingle();
      if (prefError) return { ok: false, reason: "error", error: serializeSupabaseError(prefError) };
      location = prefRow?.preferred_location ?? null;
      usedLocationFallback = Boolean(location);
    }

    return {
      ok: true,
      data: {
        name: userRow?.name ?? null,
        email: userRow?.email ?? null,
        phone_number: userRow?.phone_number ?? null,
        profile_photo_url: userRow?.profile_photo_url ?? null,
        location,
      },
      usedLocationFallback,
    };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}
