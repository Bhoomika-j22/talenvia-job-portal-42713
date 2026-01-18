import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

const STATUSES = ["Saved", "Applied", "Interview", "Offer", "Rejected"];

// PUBLIC_INTERFACE
export default function ApplicationsPage() {
  /** Job application tracking page. */
  const { state, actions } = useAppState();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);

  const [draft, setDraft] = useState({
    company: "",
    role: "",
    status: "Saved",
    appliedOn: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const apps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.applications;
    return state.applications.filter(
      (a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.status.toLowerCase().includes(q)
    );
  }, [query, state.applications]);

  const editing = useMemo(() => state.applications.find((a) => a.id === editId) || null, [editId, state.applications]);

  const openEdit = (id) => {
    const app = state.applications.find((a) => a.id === id);
    if (!app) return;
    setEditId(id);
    setDraft({ company: app.company, role: app.role, status: app.status, appliedOn: app.appliedOn, notes: app.notes || "" });
  };

  return (
    <section className="page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">Track your pipeline with statuses, notes, and follow-ups.</p>
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            setShowAdd(true);
            setEditId(null);
            setDraft({
              company: "",
              role: "",
              status: "Saved",
              appliedOn: new Date().toISOString().slice(0, 10),
              notes: "",
            });
          }}
          type="button"
        >
          + Add Application
        </button>
      </div>

      <div className="card full" style={{ marginTop: 12 }}>
        <div className="row">
          <div className="field" style={{ maxWidth: 520 }}>
            <label htmlFor="appSearch">Search</label>
            <input
              id="appSearch"
              className="input"
              value={query}
              placeholder="Search by company, role, or status"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <span className="badge" style={{ marginLeft: "auto" }}>
            {state.applications.length} tracked
          </span>
        </div>

        <div className="grid" style={{ marginTop: 12 }}>
          {apps.map((a) => (
            <div key={a.id} className="card">
              <h4 style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{a.company}</span>
                <StatusBadge status={a.status} />
              </h4>
              <p>
                <strong>{a.role}</strong> • Applied on <strong>{a.appliedOn}</strong>
              </p>
              {a.notes ? <p style={{ marginTop: 10, color: "var(--muted)" }}>{a.notes}</p> : null}

              <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => openEdit(a.id)} type="button">
                  Edit
                </button>
                <button className="btn danger" onClick={() => actions.removeApplication(a.id)} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {apps.length === 0 ? (
            <div className="card full">
              <h4>No applications found</h4>
              <p>Try a new search term or add your first application.</p>
            </div>
          ) : null}
        </div>
      </div>

      {(showAdd || editing) ? (
        <Modal
          title={editing ? `Edit • ${editing.company}` : "Add Application"}
          onClose={() => {
            setShowAdd(false);
            setEditId(null);
          }}
        >
          <div className="row">
            <div className="field">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                className="input"
                value={draft.company}
                onChange={(e) => setDraft((p) => ({ ...p, company: e.target.value }))}
                placeholder="e.g. Acme Inc"
              />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <input
                id="role"
                className="input"
                value={draft.role}
                onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value }))}
                placeholder="e.g. Frontend Engineer"
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field" style={{ maxWidth: 220 }}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                className="select"
                value={draft.status}
                onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ maxWidth: 260 }}>
              <label htmlFor="appliedOn">Applied on</label>
              <input
                id="appliedOn"
                className="input"
                type="date"
                value={draft.appliedOn}
                onChange={(e) => setDraft((p) => ({ ...p, appliedOn: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field" style={{ minWidth: "100%" }}>
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                className="textarea"
                value={draft.notes}
                onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Follow-ups, recruiter details, links, salary notes..."
              />
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
            <button className="btn" onClick={() => { setShowAdd(false); setEditId(null); }} type="button">
              Cancel
            </button>
            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                const company = draft.company.trim();
                const role = draft.role.trim();
                if (!company || !role) {
                  actions.pushToast({ type: "error", title: "Missing fields", description: "Company and role are required." });
                  return;
                }
                if (editing) {
                  actions.updateApplication(editing.id, { ...draft, company, role });
                } else {
                  actions.addApplication({ ...draft, company, role });
                }
                setShowAdd(false);
                setEditId(null);
              }}
            >
              {editing ? "Save" : "Add"}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
