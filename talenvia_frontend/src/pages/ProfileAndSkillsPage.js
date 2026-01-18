import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";

/**
 * This page is the unified Profile & Skills screen.
 * It is based on the user-provided ProfileSkills component, adapted to:
 * - use Talenvia's existing Violet Dreams CSS utility classes (page/card/input/btn/primary-btn)
 * - persist data in the app's existing local state (AppState)
 */

// PUBLIC_INTERFACE
export default function ProfileAndSkillsPage() {
  /** Unified Profile & Skills page based on the provided ProfileSkills component. */
  const { state, actions } = useAppState();

  // BASIC DETAILS + SUMMARY drafts (persist on Save Profile)
  const [profileDraft, setProfileDraft] = useState(() => ({
    fullName: state.profile.fullName || "",
    email: state.profile.email || "",
    // The provided component includes phone; Talenvia default profile doesn't.
    // We'll store it inside profile as an extra field (safe in JS objects).
    phone: state.profile.phone || "",
    location: state.profile.location || "",
    bio: state.profile.bio || "",
  }));

  // KEY SKILLS (persist via AppState skills list)
  const [newSkill, setNewSkill] = useState("");
  const existingSkillNamesLower = useMemo(
    () => new Set(state.skills.map((s) => String(s.name || "").toLowerCase())),
    [state.skills]
  );

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name) return;

    if (existingSkillNamesLower.has(name.toLowerCase())) {
      actions.pushToast({
        type: "error",
        title: "Duplicate skill",
        description: "That skill already exists.",
      });
      return;
    }

    // The user-provided component does not include a level; we default to Intermediate.
    actions.addSkill({ name, level: "Intermediate" });
    setNewSkill("");
  };

  const removeSkill = (skillName) => {
    actions.removeSkill(skillName);
  };

  return (
    <section className="page">
      <h1 className="page-title">Profile & Skills</h1>
      <p className="page-subtitle">
        Manage your profile details, upload a resume, and keep your key skills up-to-date.
      </p>

      <div className="grid">
        {/* BASIC DETAILS */}
        <div className="card full">
          <h4>Basic Details</h4>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="ps-fullname">Full Name</label>
              <input
                id="ps-fullname"
                className="input"
                placeholder="Full Name"
                value={profileDraft.fullName}
                onChange={(e) => setProfileDraft((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="ps-email">Email</label>
              <input
                id="ps-email"
                className="input"
                type="email"
                placeholder="Email"
                value={profileDraft.email}
                onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="ps-phone">Phone Number</label>
              <input
                id="ps-phone"
                className="input"
                placeholder="Phone Number"
                value={profileDraft.phone}
                onChange={(e) => setProfileDraft((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="ps-location">Location</label>
              <input
                id="ps-location"
                className="input"
                placeholder="Location"
                value={profileDraft.location}
                onChange={(e) => setProfileDraft((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* RESUME */}
        <div className="card full">
          <h4>Resume</h4>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            Resume upload is UI-only in this preview build.
          </p>

          <div className="row" style={{ marginTop: 12 }}>
            <input type="file" aria-label="Upload resume file" />
            <button
              className="primary-btn"
              type="button"
              onClick={() =>
                actions.pushToast({
                  type: "info",
                  title: "Resume upload (preview)",
                  description: "File upload is not wired to a backend yet.",
                })
              }
            >
              Upload
            </button>
            <button
              className="btn"
              type="button"
              onClick={() =>
                actions.pushToast({
                  type: "info",
                  title: "Replace resume (preview)",
                  description: "Connect a backend endpoint to store resumes.",
                })
              }
            >
              Replace
            </button>
            <button
              className="btn danger"
              type="button"
              onClick={() =>
                actions.pushToast({
                  type: "info",
                  title: "Delete resume (preview)",
                  description: "Connect a backend endpoint to delete stored resumes.",
                })
              }
            >
              Delete
            </button>
          </div>
        </div>

        {/* PROFILE SUMMARY */}
        <div className="card full">
          <h4>Profile Summary</h4>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field" style={{ minWidth: "100%" }}>
              <label htmlFor="ps-summary">Summary</label>
              <textarea
                id="ps-summary"
                rows={4}
                className="textarea"
                placeholder="Write a short professional summary..."
                value={profileDraft.bio}
                onChange={(e) => setProfileDraft((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* KEY SKILLS */}
        <div className="card full">
          <h4>Key Skills</h4>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field" style={{ flex: 1, minWidth: 260 }}>
              <label htmlFor="ps-new-skill">Add skill</label>
              <input
                id="ps-new-skill"
                className="input"
                placeholder="Add skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSkill();
                }}
              />
            </div>
            <button className="primary-btn" type="button" onClick={addSkill}>
              Add
            </button>

            <span className="badge" style={{ marginLeft: "auto" }}>
              {state.skills.length} skills
            </span>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            {state.skills.map((s) => (
              <span
                key={s.name}
                className="badge"
                style={{
                  borderColor: "rgba(124,58,237,0.22)",
                  background: "rgba(124,58,237,0.08)",
                }}
              >
                <span style={{ fontWeight: 800 }}>{s.name}</span>
                <span className="pill" style={{ background: "rgba(13,148,136,0.92)" }}>
                  {s.level || "Intermediate"}
                </span>
                <button
                  className="btn danger"
                  type="button"
                  onClick={() => removeSkill(s.name)}
                  aria-label={`Remove ${s.name}`}
                  style={{ padding: "6px 10px", borderRadius: 999 }}
                >
                  ✕
                </button>
              </span>
            ))}
            {state.skills.length === 0 ? (
              <div className="card full">
                <h4>No skills yet</h4>
                <p>Add your first skill to start building a strong profile.</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* PROJECTS */}
        <div className="card full">
          <h4>Projects</h4>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            Projects are UI-only fields for now (not persisted in this template).
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="ps-project-title">Project Title</label>
              <input id="ps-project-title" className="input" placeholder="Project Title" />
            </div>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <div className="field" style={{ minWidth: "100%" }}>
              <label htmlFor="ps-project-desc">Project Description</label>
              <textarea id="ps-project-desc" className="textarea" placeholder="Project Description" />
            </div>
          </div>
        </div>

        {/* EDUCATION */}
        <div className="card full">
          <h4>Education</h4>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            Education fields are UI-only in this preview.
          </p>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="ps-edu-10">10th School & Percentage</label>
              <input id="ps-edu-10" className="input" placeholder="10th School & Percentage" />
            </div>
            <div className="field">
              <label htmlFor="ps-edu-12">12th School & Percentage</label>
              <input id="ps-edu-12" className="input" placeholder="12th School & Percentage" />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="ps-edu-grad">Graduation (Degree, College)</label>
              <input id="ps-edu-grad" className="input" placeholder="Graduation (Degree, College)" />
            </div>
          </div>
        </div>

        {/* LANGUAGES */}
        <div className="card full">
          <h4>Languages</h4>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            Languages are UI-only in this preview.
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="ps-languages">Languages</label>
              <input id="ps-languages" className="input" placeholder="e.g. English, Hindi, Tamil" />
            </div>
          </div>
        </div>

        {/* CAREER PREFERENCES */}
        <div className="card full">
          <h4>Career Preferences</h4>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            Preferences are UI-only fields for now.
          </p>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="ps-pref-location">Preferred Location</label>
              <input id="ps-pref-location" className="input" placeholder="Preferred Location" />
            </div>

            <div className="field">
              <label htmlFor="ps-pref-role">Preferred Role</label>
              <input id="ps-pref-role" className="input" placeholder="Preferred Role" />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="ps-pref-salary">Expected Salary</label>
              <input id="ps-pref-salary" className="input" placeholder="Expected Salary" />
            </div>

            <div className="field" style={{ maxWidth: 260 }}>
              <label htmlFor="ps-pref-shift">Shift</label>
              <select id="ps-pref-shift" className="select" defaultValue="Shift">
                <option>Shift</option>
                <option>Day</option>
                <option>Night</option>
                <option>Flexible</option>
              </select>
            </div>

            <div className="field" style={{ maxWidth: 260 }}>
              <label htmlFor="ps-pref-jobtype">Job Type</label>
              <select id="ps-pref-jobtype" className="select" defaultValue="Job Type">
                <option>Job Type</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Internship</option>
              </select>
            </div>

            <div className="field" style={{ maxWidth: 260 }}>
              <label htmlFor="ps-pref-emptype">Employment Type</label>
              <select id="ps-pref-emptype" className="select" defaultValue="Employment Type">
                <option>Employment Type</option>
                <option>Permanent</option>
                <option>Contract</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="card full">
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button
              className="btn"
              type="button"
              onClick={() =>
                setProfileDraft({
                  fullName: state.profile.fullName || "",
                  email: state.profile.email || "",
                  phone: state.profile.phone || "",
                  location: state.profile.location || "",
                  bio: state.profile.bio || "",
                })
              }
            >
              Reset
            </button>
            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                actions.updateProfile({
                  fullName: profileDraft.fullName,
                  email: profileDraft.email,
                  phone: profileDraft.phone,
                  location: profileDraft.location,
                  bio: profileDraft.bio,
                });
              }}
              style={{ minWidth: 220 }}
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
