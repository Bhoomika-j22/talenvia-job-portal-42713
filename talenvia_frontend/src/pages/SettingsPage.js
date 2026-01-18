import React, { useEffect } from "react";
import { useAppState } from "../state/AppState";
import { getEnv } from "../utils/env";

// PUBLIC_INTERFACE
export default function SettingsPage() {
  /** Settings page for theme and notification preferences. */
  const { state, actions } = useAppState();
  const env = getEnv();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.settings.theme);
  }, [state.settings.theme]);

  return (
    <section className="page">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Tune the experience—theme, notifications, and environment status.</p>

      <div className="grid">
        <div className="card full">
          <h4>Appearance</h4>
          <div className="row">
            <div className="field" style={{ maxWidth: 280 }}>
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                className="select"
                value={state.settings.theme}
                onChange={(e) => actions.updateSettings({ theme: e.target.value })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <span className="badge" style={{ marginLeft: "auto" }}>
              Current: {state.settings.theme}
            </span>
          </div>
        </div>

        <div className="card full">
          <h4>Notifications</h4>
          <div className="row">
            <button
              className={`btn ${state.settings.notificationsEnabled ? "teal" : ""}`}
              type="button"
              onClick={() => actions.updateSettings({ notificationsEnabled: !state.settings.notificationsEnabled })}
            >
              {state.settings.notificationsEnabled ? "Enabled" : "Disabled"}
            </button>

            <button
              className={`btn ${state.settings.weeklyDigest ? "teal" : ""}`}
              type="button"
              onClick={() => actions.updateSettings({ weeklyDigest: !state.settings.weeklyDigest })}
            >
              Weekly digest: {state.settings.weeklyDigest ? "On" : "Off"}
            </button>

            <button
              className="btn"
              type="button"
              onClick={() =>
                actions.addNotification({
                  title: "Test notification",
                  body: "This is a sample notification popup for Talenvia.",
                  type: "info",
                })
              }
              style={{ marginLeft: "auto" }}
            >
              Send Test Notification
            </button>
          </div>
          <p style={{ marginTop: 10, color: "var(--muted)" }}>
            Notification transport can connect to <code>REACT_APP_WS_URL</code> or <code>REACT_APP_API_BASE</code> when
            backend services are available.
          </p>
        </div>

        <div className="card full">
          <h4>Environment</h4>
          <p style={{ color: "var(--muted)" }}>
            These values come from the existing <code>.env</code> variables (no hardcoding). Helpful for debugging in
            preview environments.
          </p>
          <div className="grid" style={{ marginTop: 10 }}>
            <div className="card third">
              <h4>API Base</h4>
              <p>{env.apiBase || "Not set"}</p>
            </div>
            <div className="card third">
              <h4>Backend URL</h4>
              <p>{env.backendUrl || "Not set"}</p>
            </div>
            <div className="card third">
              <h4>WebSocket URL</h4>
              <p>{env.wsUrl || "Not set"}</p>
            </div>
            <div className="card third">
              <h4>Node Env</h4>
              <p>{env.nodeEnv}</p>
            </div>
            <div className="card third">
              <h4>Feature Flags</h4>
              <p>{env.featureFlags.length ? env.featureFlags.join(", ") : "None"}</p>
            </div>
            <div className="card third">
              <h4>Experiments</h4>
              <p>{env.experimentsEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
