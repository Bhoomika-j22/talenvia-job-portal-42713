import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { signInWithGoogleOAuth } from "../utils/authHelpers";

/**
 * SignUpPage
 * - Name, email, password, confirm password
 * - Google OAuth
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

function IconGoogle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.7h5.2c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.2-.2-1.8H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-0.9 6.7-2.5l-3.2-2.4c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.5C4.6 19.7 8.1 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.2 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.7H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.3l3.3-2.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.7 14.7 2 12 2 8.1 2 4.6 4.3 2.9 7.7l3.3 2.5c.8-2.5 3.1-4.3 5.8-4.3z"
      />
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
  /** Dedicated sign-up page with email/password and Google OAuth. */
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
        description: needsConfirm
          ? "Confirm your email to finish signing in."
          : "You're signed in. Redirecting…",
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

          <div className="auth-divider" aria-hidden="true">
            <span>or</span>
          </div>

          <button
            className="btn google-btn"
            type="button"
            disabled={submitting}
            onClick={async () => {
              const res = await signInWithGoogleOAuth();
              if (!res.ok) {
                actions.pushToast({
                  type: "error",
                  title: "Google sign-in failed",
                  description: res.error?.message || "Unable to start OAuth flow.",
                  ttlMs: 5000,
                });
                return;
              }
              actions.pushToast({
                type: "info",
                title: "Redirecting…",
                description: "Continue with Google to finish signing in.",
                ttlMs: 2500,
              });
            }}
          >
            <span className="google-icon" aria-hidden="true">
              <IconGoogle />
            </span>
            Continue with Google
          </button>

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
