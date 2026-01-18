import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * SignInPage
 * - Email/password sign in
 * - "Forgot password" triggers Supabase reset email
 * - Redirects to intended route after auth (defaults to /)
 */

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.2h15A1.8 1.8 0 0 1 21.3 9v9A1.8 1.8 0 0 1 19.5 19.8h-15A1.8 1.8 0 0 1 2.7 18V9A1.8 1.8 0 0 1 4.5 7.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M3.6 8.4 12 13.5l8.4-5.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.2 11V8.8A4.8 4.8 0 0 1 12 4a4.8 4.8 0 0 1 4.8 4.8V11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6.4 11h11.2A2 2 0 0 1 19.6 13v6.8a2 2 0 0 1-2 2H6.4a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 15.1v2.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function useRedirectTarget() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectParam = params.get("redirect");
  // Default: dashboard is "/" in this app.
  return redirectParam ? decodeURIComponent(redirectParam) : "/";
}

// PUBLIC_INTERFACE
export default function SignInPage() {
  /** Dedicated sign-in page with email/password and reset-password entry point. */
  const { actions, authUser } = useAppState();
  const navigate = useNavigate();
  const redirectTo = useRedirectTarget();

  const supabaseReady = useMemo(() => isSupabaseConfigured() && Boolean(supabase), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already signed in, go to target.
  if (authUser) {
    return <div className="page">Redirecting…</div>;
  }

  const logSupabaseError = (context, error) => {
    try {
      console.error(`[Supabase Auth] ${context}`, JSON.stringify(error, null, 2));
    } catch {
      console.error(`[Supabase Auth] ${context}`, error);
    }
  };

  const handleSignIn = async () => {
    if (!supabaseReady) {
      actions.pushToast({
        type: "error",
        title: "Supabase not configured",
        description: "Missing REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_KEY.",
        ttlMs: 5000,
      });
      return;
    }

    const e = String(email || "").trim();
    if (!e || !e.includes("@")) {
      actions.pushToast({ type: "error", title: "Check email", description: "Enter a valid email address." });
      return;
    }
    if (!password || password.length < 6) {
      actions.pushToast({
        type: "error",
        title: "Check password",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: e, password });
      if (error) {
        logSupabaseError("signInWithPassword error", error);
        actions.pushToast({
          type: "error",
          title: "Sign in failed",
          description: error.message || "Unable to sign in.",
          ttlMs: 5000,
        });
        return;
      }

      actions.pushToast({
        type: "success",
        title: "Signed in",
        description: data?.user?.email ? `Welcome back, ${data.user.email}` : "Welcome back!",
        ttlMs: 2200,
      });

      navigate(redirectTo, { replace: true });
    } catch (err) {
      logSupabaseError("signInWithPassword exception", err);
      actions.pushToast({
        type: "error",
        title: "Auth error",
        description: err instanceof Error ? err.message : String(err),
        ttlMs: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!supabaseReady) {
      actions.pushToast({
        type: "error",
        title: "Supabase not configured",
        description: "Missing REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_KEY.",
        ttlMs: 5000,
      });
      return;
    }

    const e = String(email || "").trim();
    if (!e || !e.includes("@")) {
      actions.pushToast({ type: "error", title: "Enter email", description: "Type your email first, then try again." });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: window.location.origin,
      });

      if (error) {
        logSupabaseError("resetPasswordForEmail error", error);
        actions.pushToast({
          type: "error",
          title: "Reset failed",
          description: error.message || "Unable to send reset email.",
          ttlMs: 5000,
        });
        return;
      }

      actions.pushToast({
        type: "success",
        title: "Email sent",
        description: "Check your inbox for a password reset link.",
        ttlMs: 4500,
      });
    } catch (err) {
      logSupabaseError("resetPasswordForEmail exception", err);
      actions.pushToast({
        type: "error",
        title: "Reset failed",
        description: err instanceof Error ? err.message : String(err),
        ttlMs: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="auth-badge" aria-hidden="true">
            <span />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title" style={{ marginBottom: 6 }}>
              Sign in
            </h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Access your dashboard, applications, and saved profile.
            </p>
          </div>
        </div>

        <div className="auth-fields" style={{ marginTop: 14 }}>
          <div className="field">
            <label htmlFor="signin-email">Email</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <IconMail />
              </span>
              <input
                id="signin-email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="signin-password">Password</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <IconLock />
              </span>
              <input
                id="signin-password"
                className="input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSignIn();
                }}
              />
            </div>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn" type="button" onClick={handleForgotPassword} disabled={submitting}>
              Forgot password
            </button>

            <button className="primary-btn" type="button" onClick={handleSignIn} disabled={submitting}>
              {submitting ? "Please wait…" : "Sign in"}
            </button>
          </div>

          {!supabaseReady ? (
            <div className="auth-warning" role="status">
              Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable sign-in.
            </div>
          ) : null}

          <p className="auth-footnote">
            New here?{" "}
            <Link to={`/signup?redirect=${encodeURIComponent(redirectTo)}`} className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
