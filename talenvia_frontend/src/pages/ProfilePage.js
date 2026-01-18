import React, { useState } from "react";
import { useAppState } from "../state/AppState";

// PUBLIC_INTERFACE
export default function ProfilePage() {
  /** Profile management page (basic details). */
  const { state, actions } = useAppState();
  const [draft, setDraft] = useState(state.profile);

  return (
    <section className="page">
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Keep your details up to date so Talenvia can tailor suggestions and reminders.</p>

      <div className="grid">
        <div className="card full">
          <h4>Basic information</h4>
          <div className="row">
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                className="input"
                value={draft.fullName}
                onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="headline">Headline</label>
              <input
                id="headline"
                className="input"
                value={draft.headline}
                onChange={(e) => setDraft((p) => ({ ...p, headline: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                className="input"
                value={draft.location}
                onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field" style={{ minWidth: "100%" }}>
              <label htmlFor="bio">About you</label>
              <textarea
                id="bio"
                className="textarea"
                value={draft.bio}
                onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <button
              className="btn"
              onClick={() => setDraft(state.profile)}
              aria-label="Reset profile form"
              type="button"
            >
              Reset
            </button>
            <button
              className="primary-btn"
              onClick={() => actions.updateProfile(draft)}
              aria-label="Save profile"
              type="button"
            >
              Save Profile
            </button>
          </div>
        </div>

        <div className="card third">
          <h4>Quick insights</h4>
          <p>
            Tip: keep your headline role-specific to match recruiter searches. A strong headline boosts interview
            callbacks.
          </p>
        </div>

        <div className="card third">
          <h4>Next steps</h4>
          <p>
            Head to <strong>Skills</strong> to fine-tune your strengths, then try a <strong>Mock Test</strong> to build
            confidence.
          </p>
        </div>

        <div className="card third">
          <h4>Reminders</h4>
          <p>
            Enable weekly digests in <strong>Settings</strong> for a gentle nudge on applications and tests.
          </p>
        </div>
      </div>
    </section>
  );
}
