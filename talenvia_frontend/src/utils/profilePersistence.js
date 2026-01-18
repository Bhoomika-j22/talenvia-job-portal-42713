import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * Profile persistence helpers (Supabase-first, safe-by-default).
 *
 * Data model assumption (documented here since DB is external):
 * - Table: user_profiles
 * - Columns:
 *   - user_id (uuid, primary key, references auth.users.id)
 *   - profile (jsonb)
 *   - skills (jsonb)  // array
 *   - updated_at (timestamptz) optional
 *
 * RLS expectation:
 * - Users can select/update their own row where user_id = auth.uid()
 */

// PUBLIC_INTERFACE
export async function getCurrentUserId() {
  /** Returns the current Supabase auth user id, or a safe error object. Never throws. */
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { ok: false, reason: "auth_error", error: { message: error.message } };
    const userId = data?.user?.id;
    if (!userId) return { ok: false, reason: "no_user" };
    return { ok: true, userId };
  } catch (e) {
    return { ok: false, reason: "auth_error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function loadProfileAndSkillsFromSupabase() {
  /**
   * Loads profile + skills for the current user from Supabase.
   *
   * Returns:
   * - { ok:true, found:true, payload:{ profile:any, skills:any[] } }
   * - { ok:true, found:false } when no row exists yet
   * - { ok:false, reason:'not_configured'|'no_user'|'error', error?:{message} }
   */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };

  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("profile,skills")
      .eq("user_id", userRes.userId)
      .maybeSingle();

    if (error) return { ok: false, reason: "error", error: { message: error.message } };

    if (!data) return { ok: true, found: false };

    return {
      ok: true,
      found: true,
      payload: {
        profile: data.profile ?? null,
        skills: Array.isArray(data.skills) ? data.skills : [],
      },
    };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function saveProfileAndSkillsToSupabase(payload) {
  /**
   * Upserts profile + skills for the current user into Supabase.
   *
   * payload:
   * - { profile: object, skills: array }
   *
   * Returns:
   * - { ok:true }
   * - { ok:false, reason:'not_configured'|'no_user'|'error', error?:{message} }
   */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };

  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  const safeProfile = payload?.profile && typeof payload.profile === "object" ? payload.profile : {};
  const safeSkills = Array.isArray(payload?.skills) ? payload.skills : [];

  try {
    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userRes.userId,
        profile: safeProfile,
        skills: safeSkills,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) return { ok: false, reason: "error", error: { message: error.message } };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}
