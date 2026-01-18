import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";

/**
 * Jobs page (listing)
 * - UI-only demo listing to match the app's preview-mode behavior.
 * - Provides search + quick filters, and lets the user "Save as application"
 *   by adding an item into the Applications pipeline.
 */

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const WORK_MODES = ["Remote", "Hybrid", "Onsite"];

// Simple demo data; later can be replaced by API calls (REACT_APP_API_BASE / backend).
const DEMO_JOBS = [
  {
    id: "job_1",
    title: "Frontend Engineer (React)",
    company: "Nimbus Labs",
    location: "Remote",
    workMode: "Remote",
    jobType: "Full-time",
    salary: "₹18–28 LPA",
    tags: ["React", "TypeScript", "Design Systems"],
    posted: "2 days ago",
  },
  {
    id: "job_2",
    title: "Backend Engineer (Node.js)",
    company: "TealStack",
    location: "Bengaluru",
    workMode: "Hybrid",
    jobType: "Full-time",
    salary: "₹20–32 LPA",
    tags: ["Node.js", "Postgres", "REST APIs"],
    posted: "5 days ago",
  },
  {
    id: "job_3",
    title: "Data Analyst",
    company: "Acme Insights",
    location: "Mumbai",
    workMode: "Onsite",
    jobType: "Contract",
    salary: "₹10–16 LPA",
    tags: ["SQL", "Excel", "Dashboards"],
    posted: "1 week ago",
  },
  {
    id: "job_4",
    title: "QA Engineer",
    company: "VioletWorks",
    location: "Remote",
    workMode: "Remote",
    jobType: "Part-time",
    salary: "₹8–12 LPA",
    tags: ["Playwright", "CI", "Automation"],
    posted: "3 days ago",
  },
];

function normalize(str) {
  return String(str || "").trim().toLowerCase();
}

// PUBLIC_INTERFACE
export default function JobsPage() {
  /** Jobs listing page with search, quick filters, and a "Save as application" action. */
  const { state, actions } = useAppState();

  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);

    return DEMO_JOBS.filter((j) => {
      const matchesQuery =
        !q ||
        normalize(j.title).includes(q) ||
        normalize(j.company).includes(q) ||
        normalize(j.location).includes(q) ||
        (j.tags || []).some((t) => normalize(t).includes(q));

      const matchesJobType = !jobType || j.jobType === jobType;
      const matchesWorkMode = !workMode || j.workMode === workMode;

      return matchesQuery && matchesJobType && matchesWorkMode;
    });
  }, [query, jobType, workMode]);

  const alreadyTracked = useMemo(() => {
    // In preview mode, "tracked" means it exists in Applications by company+role.
    const set = new Set(state.applications.map((a) => `${normalize(a.company)}__${normalize(a.role)}`));
    return set;
  }, [state.applications]);

  const saveAsApplication = (job) => {
    const key = `${normalize(job.company)}__${normalize(job.title)}`;
    if (alreadyTracked.has(key)) {
      actions.pushToast({
        type: "info",
        title: "Already tracked",
        description: "This job is already in your Applications list.",
      });
      return;
    }

    actions.addApplication({
      company: job.company,
      role: job.title,
      status: "Saved",
      appliedOn: new Date().toISOString().slice(0, 10),
      notes: `Saved from Jobs • ${job.workMode} • ${job.jobType}${job.salary ? ` • ${job.salary}` : ""}`,
    });

    actions.pushToast({
      type: "success",
      title: "Saved to Applications",
      description: "You can now manage it in your pipeline.",
    });
  };

  return (
    <section className="page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-subtitle">Browse opportunities and save them into your application pipeline.</p>
        </div>
        <span className="badge">{filtered.length} results</span>
      </div>

      <div className="card full" style={{ marginTop: 12 }}>
        <div className="row">
          <div className="field" style={{ maxWidth: 520 }}>
            <label htmlFor="jobsSearch">Search</label>
            <input
              id="jobsSearch"
              className="input"
              value={query}
              placeholder="Search by title, company, location, or tag"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="field" style={{ maxWidth: 220 }}>
            <label htmlFor="jobTypeFilter">Job type</label>
            <select
              id="jobTypeFilter"
              className="select"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="">All</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ maxWidth: 220 }}>
            <label htmlFor="workModeFilter">Work mode</label>
            <select
              id="workModeFilter"
              className="select"
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
            >
              <option value="">All</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="row" style={{ marginLeft: "auto" }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setQuery("");
                setJobType("");
                setWorkMode("");
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid" style={{ marginTop: 12 }}>
          {filtered.map((job) => {
            const key = `${normalize(job.company)}__${normalize(job.title)}`;
            const isTracked = alreadyTracked.has(key);

            return (
              <div key={job.id} className="card">
                <h4 style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{job.title}</span>
                  <span className="pill" style={{ background: "rgba(13,148,136,0.92)" }}>
                    {job.workMode}
                  </span>
                </h4>

                <p>
                  <strong>{job.company}</strong> • {job.location}
                </p>

                <p style={{ marginTop: 8, color: "var(--muted)" }}>
                  {job.jobType}
                  {job.salary ? ` • ${job.salary}` : ""} • Posted {job.posted}
                </p>

                <div className="row" style={{ marginTop: 10 }}>
                  {(job.tags || []).map((t) => (
                    <span
                      key={t}
                      className="badge"
                      style={{
                        borderColor: "rgba(124,58,237,0.22)",
                        background: "rgba(124,58,237,0.08)",
                        fontSize: 12,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                  <button
                    className={isTracked ? "btn" : "primary-btn"}
                    type="button"
                    onClick={() => saveAsApplication(job)}
                    disabled={isTracked}
                    aria-disabled={isTracked}
                    title={isTracked ? "Already in Applications" : "Save to Applications"}
                    style={isTracked ? { opacity: 0.75, cursor: "not-allowed" } : undefined}
                  >
                    {isTracked ? "Tracked" : "Save as application"}
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 ? (
            <div className="card full">
              <h4>No jobs found</h4>
              <p>Try a different search term or broaden the filters.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
