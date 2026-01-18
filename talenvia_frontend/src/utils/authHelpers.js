import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * Auth helpers (Supabase OAuth).
 *
 * We keep these in a small module so UI components (App header, auth screens)
 * can call stable functions without duplicating URL/session checks.
 */

// PUBLIC_INTERFACE
export function getOAuthRedirectUrl() {
  /** Returns the redirect URL to use for Supabase OAuth flows. */
  if (typeof window === "undefined") return "";
  // As requested: use window.location.origin (works for dev + deployed)
  return window.location.origin;
}

// PUBLIC_INTERFACE
export async function signInWithGoogleOAuth() {
  /**
   * Starts Supabase Google OAuth sign-in.
   *
   * Returns:
   * - { ok: true }
   * - { ok: false, reason: 'not_configured' | 'error', error?: { message } }
   */
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, reason: "not_configured", error: { message: "Supabase is not configured." } };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getOAuthRedirectUrl() },
    });

    if (error) {
      return { ok: false, reason: "error", error: { message: error.message } };
    }

    // NOTE: On success, Supabase will redirect away; session is handled on return via detectSessionInUrl
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}
