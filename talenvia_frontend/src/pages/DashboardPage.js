import React, { useMemo } from "react";
import { useAppState } from "../state/AppState";
import StatusBadge from "../components/StatusBadge";

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Landing dashboard overview page. */
  const { state, actions } = useAppState();

  const counts = useMemo(() => {
    const byStatus = state.applications.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
    return {
      skills: state.skills.length,
      apps: state.applications.length,
      testsDone: state.mockTests.filter((t) => t.status === "Completed").length,
      byStatus,
    };
  }, [state]);

  return (
    <section className="page">
      <h1 className="page-title">Welcome to Talenvia</h1>
      <p className="page-subtitle">Your job search cockpit—organized, calm, and actionable.</p>

      <div className="grid">
        <div className="card third">
          <h4>Profile</h4>
          <p>
            <strong>{state.profile.fullName}</strong>
          </p>
          <p>{state.profile.headline}</p>
        </div>

        <div className="card third">
          <h4>Skills</h4>
          <p>
            You’ve listed <strong>{counts.skills}</strong> skills.
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn teal" onClick={() => actions.pushToast({ type: "info", title: "Tip", description: "Add 1 new skill each week to track growth." })} type="button">
              Quick tip
            </button>
          </div>
        </div>

        <div className="card third">
          <h4>Mock tests</h4>
          <p>
            Completed: <strong>{counts.testsDone}</strong> / {state.mockTests.length}
          </p>
          <p style={{ color: "var(--muted)" }}>Consistency beats intensity—small practice every day.</p>
        </div>

        <div className="card full">
          <h4>Application pipeline</h4>
          <div className="row" style={{ gap: 12 }}>
            {["Saved", "Applied", "Interview", "Offer", "Rejected"].map((s) => (
              <div key={s} className="badge">
                <StatusBadge status={s} /> <span style={{ marginLeft: 6 }}>{counts.byStatus[s] || 0}</span>
              </div>
            ))}
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            {state.applications.slice(0, 3).map((a) => (
              <div key={a.id} className="card third">
                <h4 style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{a.company}</span>
                  <StatusBadge status={a.status} />
                </h4>
                <p>
                  <strong>{a.role}</strong> • {a.appliedOn}
                </p>
                {a.notes ? <p style={{ marginTop: 10, color: "var(--muted)" }}>{a.notes}</p> : null}
              </div>
            ))}
            {state.applications.length === 0 ? (
              <div className="card full">
                <h4>No tracked applications yet</h4>
                <p>Add your first application to start building momentum.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
