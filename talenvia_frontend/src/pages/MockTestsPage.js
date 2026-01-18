import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import Modal from "../components/Modal";

function titleToCategory(title) {
  // Heuristic mapping so we can add category filtering without changing persisted data.
  const t = String(title || "").toLowerCase();
  if (t.includes("react")) return "React";
  if (t.includes("javascript")) return "JavaScript";
  if (t.includes("typescript")) return "TypeScript";
  if (t.includes("css")) return "CSS";
  if (t.includes("system design")) return "System Design";
  if (t.includes("behavioral")) return "Behavioral";
  if (t.includes("data structures")) return "Data Structures";
  if (t.includes("debug")) return "Debugging";
  return "General";
}

function titleToDifficulty(title) {
  // Heuristic mapping based on keywords/expected complexity.
  const t = String(title || "").toLowerCase();
  if (t.includes("fundamentals") || t.includes("basics") || t.includes("prep")) return "Beginner";
  if (t.includes("essentials") || t.includes("layout") || t.includes("arrays") || t.includes("hash")) return "Intermediate";
  if (t.includes("algorithms") || t.includes("system design") || t.includes("debug")) return "Advanced";
  return "Intermediate";
}

function minutesFromTitle(title) {
  // Parses "(15 mins)" style durations for optional sorting/UX.
  const match = String(title || "").match(/\((\d+)\s*mins?\)/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

// PUBLIC_INTERFACE
export default function MockTestsPage() {
  /** Mock tests page for practice and confidence building. */
  const { state, actions } = useAppState();
  const [active, setActive] = useState(null); // test id
  const [scoreDraft, setScoreDraft] = useState(75);

  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const testsEnriched = useMemo(() => {
    return state.mockTests.map((t) => {
      const derivedCategory = t.category || titleToCategory(t.title);
      const derivedDifficulty = t.difficulty || titleToDifficulty(t.title);
      return {
        ...t,
        _derivedCategory: derivedCategory,
        _derivedDifficulty: derivedDifficulty,
        _minutes: minutesFromTitle(t.title),
      };
    });
  }, [state.mockTests]);

  const availableCategories = useMemo(() => {
    const set = new Set(testsEnriched.map((t) => t._derivedCategory).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))];
  }, [testsEnriched]);

  const availableDifficulties = useMemo(() => {
    const set = new Set(testsEnriched.map((t) => t._derivedDifficulty).filter(Boolean));
    const order = ["Beginner", "Intermediate", "Advanced"];
    const list = Array.from(set);
    list.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return ["All", ...list];
  }, [testsEnriched]);

  const filteredTests = useMemo(() => {
    return testsEnriched.filter((t) => {
      const okCategory = category === "All" ? true : t._derivedCategory === category;
      const okDifficulty = difficulty === "All" ? true : t._derivedDifficulty === difficulty;
      return okCategory && okDifficulty;
    });
  }, [testsEnriched, category, difficulty]);

  const activeTest = useMemo(() => state.mockTests.find((t) => t.id === active) || null, [active, state.mockTests]);

  return (
    <section className="page">
      <h1 className="page-title">Mock Tests</h1>
      <p className="page-subtitle">
        Practice bite-sized assessments. (Mocked locally; integrate with backend when available.)
      </p>

      <div className="card full" style={{ marginBottom: 12 }}>
        <div className="row">
          <div className="field">
            <label htmlFor="mt-category">Category</label>
            <select
              id="mt-category"
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="mt-difficulty">Difficulty</label>
            <select
              id="mt-difficulty"
              className="select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {availableDifficulties.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="row" style={{ alignSelf: "flex-end", justifyContent: "flex-end" }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setCategory("All");
                setDifficulty("All");
              }}
            >
              Reset
            </button>

            <span
              className="badge"
              title={`${filteredTests.length} of ${state.mockTests.length} tests shown`}
              style={{ borderColor: "rgba(124, 58, 237, 0.22)" }}
            >
              Showing {filteredTests.length}/{state.mockTests.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid">
        {filteredTests.length ? (
          filteredTests.map((t) => (
            <div key={t.id} className="card">
              <h4 style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{t.title}</span>
                <span
                  className="pill"
                  style={{
                    background: t.status === "Completed" ? "rgba(13,148,136,0.92)" : "rgba(124,58,237,0.92)",
                  }}
                >
                  {t.status}
                </span>
              </h4>

              <div className="row" style={{ marginBottom: 8 }}>
                <span
                  className="badge"
                  style={{
                    fontWeight: 800,
                    borderColor: "rgba(124, 58, 237, 0.20)",
                    background: "rgba(124, 58, 237, 0.06)",
                  }}
                >
                  {t._derivedCategory}
                </span>
                <span
                  className="badge"
                  style={{
                    fontWeight: 800,
                    borderColor: "rgba(13, 148, 136, 0.18)",
                    background: "rgba(13, 148, 136, 0.06)",
                  }}
                >
                  {t._derivedDifficulty}
                </span>
                {t._minutes ? (
                  <span className="badge" style={{ fontWeight: 800 }}>
                    {t._minutes} mins
                  </span>
                ) : null}
              </div>

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
          ))
        ) : (
          <div className="card full">
            <h4>No results</h4>
            <p>
              Try clearing filters. Your mock tests are stored locally via <code>localStorage</code>.
            </p>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setCategory("All");
                  setDifficulty("All");
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        <div className="card full">
          <h4>How it works</h4>
          <p>
            Start a test, then submit a score to simulate evaluation. Real scoring and question banks can connect to your
            backend via <code>REACT_APP_API_BASE</code>.
          </p>
        </div>
      </div>

      {activeTest ? (
        <Modal title={`Mock Test • ${activeTest.title}`} onClose={() => setActive(null)}>
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
