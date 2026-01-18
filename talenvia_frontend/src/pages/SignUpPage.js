import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * SignUpPage
 * - Name, email, password, confirm password
 * - Redirect to dashboard after successful signup/signin (or prompt for email confirmation)
 */

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.5 8.2a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4.5 20.2c1.6-3.4 4.4-5.2 7.5-5.2s5.9 1.8 7.5 5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
  return redirectParam ? decodeURIComponent(redirectParam) : "/";
}

// PUBLIC_INTERFACE
export default function SignUpPage() {
  /** Dedicated sign-up page with email/password. */
  const { actions, authUser } = useAppState();
  const navigate = useNavigate();
  const redirectTo = useRedirectTarget();

  const supabaseReady = useMemo(() => isSupabaseConfigured() && Boolean(supabase), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleSignUp = async () => {
    if (!supabaseReady) {
      actions.pushToast({
        type: "error",
        title: "Supabase not configured",
        description: "Missing REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_KEY.",
        ttlMs: 5000,
      });
      return;
    }

    const n = String(name || "").trim();
    const e = String(email || "").trim();

    if (!n) {
      actions.pushToast({ type: "error", title: "Name required", description: "Please enter your name." });
      return;
    }
    if (!e || !e.includes("@")) {
      actions.pushToast({ type: "error", title: "Email required", description: "Please enter a valid email address." });
      return;
    }
    if (!password || password.length < 6) {
      actions.pushToast({ type: "error", title: "Weak password", description: "Use at least 6 characters." });
      return;
    }
    if (password !== confirmPassword) {
      actions.pushToast({ type: "error", title: "Passwords mismatch", description: "Confirm password must match." });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: {
          data: {
            full_name: n,
            name: n,
          },
        },
      });

      if (error) {
        logSupabaseError("signUp error", error);
        actions.pushToast({
          type: "error",
          title: "Sign up failed",
          description: error.message || "Unable to create account.",
          ttlMs: 5000,
        });
        return;
      }

      const needsConfirm = !data?.session;

      actions.pushToast({
        type: "success",
        title: needsConfirm ? "Check your email" : "Account created",
        description: needsConfirm ? "Confirm your email to finish signing in." : "You're signed in. Redirecting…",
        ttlMs: 4500,
      });

      if (!needsConfirm) {
        navigate(redirectTo, { replace: true });
      } else {
        // Stay on page; user must confirm email depending on Supabase project settings.
      }
    } catch (err) {
      logSupabaseError("signUp exception", err);
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

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="auth-badge" aria-hidden="true">
            <span />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title" style={{ marginBottom: 6 }}>
              Create account
            </h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Join Talenvia and unlock your personalized job dashboard.
            </p>
          </div>
        </div>

        <div className="auth-fields" style={{ marginTop: 14 }}>
          <div className="field">
            <label htmlFor="signup-name">Name</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <IconUser />
              </span>
              <input
                id="signup-name"
                className="input"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="signup-email">Email</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <IconMail />
              </span>
              <input
                id="signup-email"
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
            <label htmlFor="signup-password">Password</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <IconLock />
              </span>
              <input
                id="signup-password"
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="signup-confirm">Confirm password</label>
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <IconLock />
              </span>
              <input
                id="signup-confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSignUp();
                }}
              />
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="primary-btn" type="button" onClick={handleSignUp} disabled={submitting}>
              {submitting ? "Please wait…" : "Create account"}
            </button>
          </div>

          {!supabaseReady ? (
            <div className="auth-warning" role="status">
              Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable sign-up.
            </div>
          ) : null}

          <p className="auth-footnote">
            Already have an account?{" "}
            <Link to={`/signin?redirect=${encodeURIComponent(redirectTo)}`} className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
