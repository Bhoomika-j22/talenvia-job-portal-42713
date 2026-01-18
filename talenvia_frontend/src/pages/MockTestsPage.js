import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import Modal from "../components/Modal";

// PUBLIC_INTERFACE
export default function MockTestsPage() {
  /** Mock tests page for practice and confidence building. */
  const { state, actions } = useAppState();
  const [active, setActive] = useState(null); // test id
  const [scoreDraft, setScoreDraft] = useState(75);

  const activeTest = useMemo(() => state.mockTests.find((t) => t.id === active) || null, [active, state.mockTests]);

  return (
    <section className="page">
      <h1 className="page-title">Mock Tests</h1>
      <p className="page-subtitle">
        Practice bite-sized assessments. (Mocked locally; integrate with backend when available.)
      </p>

      <div className="grid">
        {state.mockTests.map((t) => (
          <div key={t.id} className="card">
            <h4 style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{t.title}</span>
              <span className="pill" style={{ background: t.status === "Completed" ? "rgba(13,148,136,0.92)" : "rgba(124,58,237,0.92)" }}>
                {t.status}
              </span>
            </h4>
            <p>
              {t.status === "Completed"
                ? `Score: ${t.score}% • Last attempt: ${t.lastAttempt ? new Date(t.lastAttempt).toLocaleString() : "—"}`
                : `Last attempt: ${t.lastAttempt ? new Date(t.lastAttempt).toLocaleString() : "—"}`}
            </p>

            <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
              {t.status !== "In progress" ? (
                <button
                  className="btn teal"
                  onClick={() => {
                    actions.startMockTest(t.id);
                    setActive(t.id);
                    setScoreDraft(75);
                  }}
                  type="button"
                >
                  Start
                </button>
              ) : (
                <button className="btn" onClick={() => setActive(t.id)} type="button">
                  Continue
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="card full">
          <h4>How it works</h4>
          <p>
            Start a test, then submit a score to simulate evaluation. Real scoring and question banks can connect to your
            backend via <code>REACT_APP_API_BASE</code>.
          </p>
        </div>
      </div>

      {activeTest ? (
        <Modal
          title={`Mock Test • ${activeTest.title}`}
          onClose={() => setActive(null)}
        >
          <div className="card full" style={{ border: "none", boxShadow: "none", padding: 0, background: "transparent" }}>
            <h4 style={{ marginTop: 0 }}>Simulated attempt</h4>
            <p style={{ color: "var(--muted)" }}>
              This is a UI-only flow. Use the slider to set a score and submit to complete the test.
            </p>

            <div className="row" style={{ marginTop: 12 }}>
              <div className="field">
                <label htmlFor="score">Score: {scoreDraft}%</label>
                <input
                  id="score"
                  className="input"
                  type="range"
                  min={0}
                  max={100}
                  value={scoreDraft}
                  onChange={(e) => setScoreDraft(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn" onClick={() => setActive(null)} type="button">
                Close
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  actions.submitMockTest(activeTest.id, scoreDraft);
                  setActive(null);
                }}
                type="button"
              >
                Submit
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
