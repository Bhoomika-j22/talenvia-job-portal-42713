import React, { useMemo, useState } from "react";
import Modal from "./Modal";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { signInWithGoogleOAuth } from "../utils/authHelpers";

/**
 * AuthModal
 * - Provides email/password sign-in and sign-up flows alongside Google OAuth
 * - Does NOT mutate session directly; relies on existing onAuthStateChange in App.js
 * - Uses existing toasts via `actions.pushToast`
 */

// PUBLIC_INTERFACE
export default function AuthModal({ mode = "signin", onClose, actions }) {
  /** Auth modal for email/password sign-in/sign-up. */
  const [tab, setTab] = useState(mode === "signup" ? "signup" : "signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const supabaseReady = useMemo(() => isSupabaseConfigured() && Boolean(supabase), []);

  const validate = () => {
    const e = String(email || "").trim();
    if (!e) return { ok: false, message: "Email is required." };
    if (!e.includes("@")) return { ok: false, message: "Please enter a valid email address." };
    if (!password || password.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }
    if (tab === "signup") {
      if (password !== confirmPassword) return { ok: false, message: "Passwords do not match." };
    }
    return { ok: true };
  };

  const logSupabaseError = (context, error) => {
    try {
      // Requirement: console.error with Supabase error JSON
      console.error(`[Supabase Auth] ${context}`, JSON.stringify(error, null, 2));
    } catch {
      console.error(`[Supabase Auth] ${context}`, error);
    }
  };

  const handleEmailPassword = async () => {
    if (!supabaseReady) {
      actions?.pushToast?.({
        type: "error",
        title: "Supabase not configured",
        description: "Missing REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_KEY.",
        ttlMs: 5000,
      });
      return;
    }

    const v = validate();
    if (!v.ok) {
      actions?.pushToast?.({ type: "error", title: "Check details", description: v.message, ttlMs: 4500 });
      return;
    }

    setSubmitting(true);
    try {
      if (tab === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: String(email).trim(),
          password,
        });

        if (error) {
          logSupabaseError("signInWithPassword error", error);
          actions?.pushToast?.({
            type: "error",
            title: "Sign in failed",
            description: error.message || "Unable to sign in.",
            ttlMs: 5000,
          });
          return;
        }

        // Session will be handled by onAuthStateChange.
        actions?.pushToast?.({
          type: "success",
          title: "Signed in",
          description: data?.user?.email ? `Welcome back, ${data.user.email}` : "Welcome back!",
          ttlMs: 2200,
        });
        onClose?.();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: String(email).trim(),
          password,
        });

        if (error) {
          logSupabaseError("signUp error", error);
          actions?.pushToast?.({
            type: "error",
            title: "Sign up failed",
            description: error.message || "Unable to sign up.",
            ttlMs: 5000,
          });
          return;
        }

        // Depending on Supabase project settings, this may require email confirmation.
        const needsConfirm = !data?.session;
        actions?.pushToast?.({
          type: "success",
          title: needsConfirm ? "Check your email" : "Account created",
          description: needsConfirm
            ? "Confirm your email to finish signing in."
            : "You’re signed in. Setting up your profile…",
          ttlMs: 4500,
        });

        onClose?.();
      }
    } catch (e) {
      logSupabaseError("unexpected exception", e);
      actions?.pushToast?.({
        type: "error",
        title: "Auth error",
        description: e instanceof Error ? e.message : String(e),
        ttlMs: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const title = tab === "signin" ? "Sign in" : "Create account";

  return (
    <Modal title={title} onClose={onClose}>
      <div className="auth-modal">
        <div className="auth-tabs" role="tablist" aria-label="Authentication tabs">
          <button
            type="button"
            className={`auth-tab ${tab === "signin" ? "active" : ""}`}
            onClick={() => setTab("signin")}
            disabled={submitting}
            role="tab"
            aria-selected={tab === "signin"}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => setTab("signup")}
            disabled={submitting}
            role="tab"
            aria-selected={tab === "signup"}
          >
            Sign up
          </button>
        </div>

        <div className="auth-grid" style={{ marginTop: 12 }}>
          <div className="field" style={{ minWidth: 0 }}>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              disabled={submitting}
            />
          </div>

          <div className="field" style={{ minWidth: 0 }}>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={submitting}
            />
          </div>

          {tab === "signup" ? (
            <div className="field" style={{ minWidth: 0 }}>
              <label htmlFor="auth-confirm">Confirm password</label>
              <input
                id="auth-confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>
          ) : null}
        </div>

        <div className="row" style={{ marginTop: 14, justifyContent: "space-between", alignItems: "center" }}>
          <p className="auth-hint" style={{ margin: 0 }}>
            {tab === "signup" ? "Passwords must be at least 6 characters." : "Use your email and password to sign in."}
          </p>

          <button className="primary-btn" type="button" onClick={handleEmailPassword} disabled={submitting}>
            {submitting ? "Please wait…" : tab === "signin" ? "Sign in" : "Create account"}
          </button>
        </div>

        <div className="auth-divider" aria-hidden="true">
          <span>or</span>
        </div>

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button
            className="btn"
            type="button"
            disabled={submitting}
            onClick={async () => {
              const res = await signInWithGoogleOAuth();
              if (!res.ok) {
                actions?.pushToast?.({
                  type: "error",
                  title: "Google sign-in failed",
                  description: res.error?.message || "Unable to start OAuth flow.",
                  ttlMs: 5000,
                });
                return;
              }
              actions?.pushToast?.({
                type: "info",
                title: "Redirecting…",
                description: "Continue with Google to finish signing in.",
                ttlMs: 2500,
              });
            }}
          >
            Continue with Google
          </button>
        </div>

        {!supabaseReady ? (
          <div className="auth-warning" role="status" style={{ marginTop: 12 }}>
            Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable sign-in.
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
