/**
 * Auth helpers (Supabase).
 *
 * Google OAuth has been removed from the product auth flow.
 * This module is kept as a small compatibility layer so any stale imports
 * do not break the build (returns a consistent "not_supported" response).
 */

// PUBLIC_INTERFACE
export function getOAuthRedirectUrl() {
  /** Returns the redirect URL to use for Supabase auth flows that require a redirect URL. */
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

// PUBLIC_INTERFACE
export async function signInWithGoogleOAuth() {
  /**
   * Compatibility stub.
   *
   * Google OAuth is intentionally not supported in this app.
   * Callers should remove UI that relies on this and use email/password auth instead.
   */
  return {
    ok: false,
    reason: "not_supported",
    error: { message: "Google OAuth is not supported. Use email/password sign-in." },
  };
}
