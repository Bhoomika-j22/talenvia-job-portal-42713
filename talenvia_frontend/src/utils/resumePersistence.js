import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getCurrentUserId } from "./profilePersistence";

/**
 * Resume metadata persistence (stored inside `user_profiles.profile.resume`).
 *
 * We keep this separate from profilePersistence.js to avoid expanding that file further,
 * and to keep resume-related concerns isolated.
 */

// PUBLIC_INTERFACE
export async function updateResumeMetadataInSupabase(resume) {
  /** Updates only the resume object within the current user's profile JSON. Never throws. */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };

  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  const safeResume = resume && typeof resume === "object" ? resume : null;

  try {
    // Fetch existing profile so we can patch the resume field without clobbering other profile fields.
    const { data, error } = await supabase.from("user_profiles").select("profile").eq("user_id", userRes.userId).maybeSingle();

    if (error) return { ok: false, reason: "error", error: { message: error.message } };

    const existingProfile = data?.profile && typeof data.profile === "object" ? data.profile : {};
    const nextProfile = { ...existingProfile, resume: safeResume };

    const { error: upsertErr } = await supabase.from("user_profiles").upsert(
      {
        user_id: userRes.userId,
        profile: nextProfile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) return { ok: false, reason: "error", error: { message: upsertErr.message } };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}
