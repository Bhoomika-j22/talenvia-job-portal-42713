import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import Modal from "../components/Modal";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

// PUBLIC_INTERFACE
export default function ProfileAndSkillsPage() {
  /** Unified page combining Profile editing and Skills management. */
  const { state, actions } = useAppState();

  // Keep draft in sync with current profile; allow user edits prior to Save.
  const [profileDraft, setProfileDraft] = useState(state.profile);

  // Skills UI state
  const [query, setQuery] = useState("");
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillDraft, setSkillDraft] = useState({ name: "", level: "Intermediate" });

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.skills;
    return state.skills.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, state.skills]);

  return (
    <section className="page">
      <h1 className="page-title">Profile & Skills</h1>
      <p className="page-subtitle">
        Update your profile narrative and keep your skills list current—both power recommendations and practice focus.
      </p>

      <div className="grid">
        {/* Profile card */}
        <div className="card full">
          <h4>Profile</h4>

          <div className="row">
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                className="input"
                value={profileDraft.fullName}
                onChange={(e) => setProfileDraft((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                value={profileDraft.email}
                onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="headline">Headline</label>
              <input
                id="headline"
                className="input"
                value={profileDraft.headline}
                onChange={(e) => setProfileDraft((p) => ({ ...p, headline: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                className="input"
                value={profileDraft.location}
                onChange={(e) => setProfileDraft((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field" style={{ minWidth: "100%" }}>
              <label htmlFor="bio">About you</label>
              <textarea
                id="bio"
                className="textarea"
                value={profileDraft.bio}
                onChange={(e) => setProfileDraft((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
            <button
              className="btn"
              onClick={() => setProfileDraft(state.profile)}
              aria-label="Reset profile form"
              type="button"
            >
              Reset
            </button>
            <button
              className="primary-btn"
              onClick={() => actions.updateProfile(profileDraft)}
              aria-label="Save profile"
              type="button"
            >
              Save Profile
            </button>
          </div>
        </div>

        {/* Skills card */}
        <div className="card full">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h4 style={{ margin: 0 }}>Skills</h4>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                Curate your skill set—Talenvia uses it to guide mock tests and application focus.
              </p>
            </div>

            <button className="primary-btn" onClick={() => setShowAddSkill(true)} type="button">
              + Add Skill
            </button>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="field" style={{ maxWidth: 420 }}>
              <label htmlFor="skillSearch">Search</label>
              <input
                id="skillSearch"
                className="input"
                value={query}
                placeholder="e.g. React, SQL, System Design"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="badge" style={{ marginLeft: "auto" }}>
              {state.skills.length} skills
            </span>
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            {filteredSkills.map((s) => (
              <div key={s.name} className="card third">
                <h4 style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{s.name}</span>
                  <span className="pill" style={{ background: "rgba(13, 148, 136, 0.92)" }}>
                    {s.level}
                  </span>
                </h4>
                <p>Use this skill as a target for mock tests and application notes.</p>
                <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
                  <button className="btn danger" onClick={() => actions.removeSkill(s.name)} type="button">
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {filteredSkills.length === 0 ? (
              <div className="card full">
                <h4>No matching skills</h4>
                <p>Try a different search term or add a new skill.</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Helpful side cards */}
        <div className="card third">
          <h4>Quick insights</h4>
          <p>
            Tip: keep your headline role-specific to match recruiter searches. A strong headline boosts interview
            callbacks.
          </p>
        </div>

        <div className="card third">
          <h4>Momentum</h4>
          <p>
            Add one new skill each week. Small updates keep your profile aligned with the roles you’re targeting.
          </p>
        </div>

        <div className="card third">
          <h4>Next steps</h4>
          <p>
            Once your profile and skills look good, jump into <strong>Mock Tests</strong> to build confidence.
          </p>
        </div>
      </div>

      {showAddSkill ? (
        <Modal
          title="Add Skill"
          onClose={() => {
            setShowAddSkill(false);
            setSkillDraft({ name: "", level: "Intermediate" });
          }}
        >
          <div className="row">
            <div className="field">
              <label htmlFor="skillName">Skill</label>
              <input
                id="skillName"
                className="input"
                value={skillDraft.name}
                onChange={(e) => setSkillDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. React, Python, AWS"
              />
            </div>

            <div className="field" style={{ maxWidth: 220 }}>
              <label htmlFor="skillLevel">Level</label>
              <select
                id="skillLevel"
                className="select"
                value={skillDraft.level}
                onChange={(e) => setSkillDraft((p) => ({ ...p, level: e.target.value }))}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
            <button className="btn" onClick={() => setShowAddSkill(false)} type="button">
              Cancel
            </button>

            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                const name = skillDraft.name.trim();
                if (!name) {
                  actions.pushToast({ type: "error", title: "Missing skill", description: "Please enter a skill name." });
                  return;
                }
                if (state.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
                  actions.pushToast({ type: "error", title: "Duplicate skill", description: "That skill already exists." });
                  return;
                }
                actions.addSkill({ name, level: skillDraft.level });
                setShowAddSkill(false);
                setSkillDraft({ name: "", level: "Intermediate" });
              }}
            >
              Add
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
