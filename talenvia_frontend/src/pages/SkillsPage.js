import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import Modal from "../components/Modal";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

// PUBLIC_INTERFACE
export default function SkillsPage() {
  /** Skills management page. */
  const { state, actions } = useAppState();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", level: "Intermediate" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.skills;
    return state.skills.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, state.skills]);

  return (
    <section className="page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Skills</h1>
          <p className="page-subtitle">Curate your skill set—Talenvia uses it to generate practice and tracking focus.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowAdd(true)} type="button">
          + Add Skill
        </button>
      </div>

      <div className="card full" style={{ marginTop: 12 }}>
        <div className="row">
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
          {filtered.map((s) => (
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
          {filtered.length === 0 ? (
            <div className="card full">
              <h4>No matching skills</h4>
              <p>Try a different search term or add a new skill.</p>
            </div>
          ) : null}
        </div>
      </div>

      {showAdd ? (
        <Modal
          title="Add Skill"
          onClose={() => {
            setShowAdd(false);
            setDraft({ name: "", level: "Intermediate" });
          }}
        >
          <div className="row">
            <div className="field">
              <label htmlFor="skillName">Skill</label>
              <input
                id="skillName"
                className="input"
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. React, Python, AWS"
              />
            </div>
            <div className="field" style={{ maxWidth: 220 }}>
              <label htmlFor="skillLevel">Level</label>
              <select
                id="skillLevel"
                className="select"
                value={draft.level}
                onChange={(e) => setDraft((p) => ({ ...p, level: e.target.value }))}
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
            <button className="btn" onClick={() => setShowAdd(false)} type="button">
              Cancel
            </button>
            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                const name = draft.name.trim();
                if (!name) {
                  actions.pushToast({ type: "error", title: "Missing skill", description: "Please enter a skill name." });
                  return;
                }
                if (state.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
                  actions.pushToast({ type: "error", title: "Duplicate skill", description: "That skill already exists." });
                  return;
                }
                actions.addSkill({ name, level: draft.level });
                setShowAdd(false);
                setDraft({ name: "", level: "Intermediate" });
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
