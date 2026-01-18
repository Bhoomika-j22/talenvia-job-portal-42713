import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";

/**
 * Jobs page (listing)
 * - UI-only demo listing to match the app's preview-mode behavior.
 * - Provides filters and lets the user "Save as application"
 *   by adding an item into the Applications pipeline.
 *
 * Filters:
 * - Job type
 * - Experience level
 *
 * Note: Global header search (routes to /search) is intentionally not modified here.
 */

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior", "Lead"];

// Simple demo data; later can be replaced by API calls (REACT_APP_API_BASE / backend).
const DEMO_JOBS = [
  {
    id: "job_1",
    title: "Frontend Engineer (React)",
    company: "Nimbus Labs",
    location: "Remote",
    workMode: "Remote",
    jobType: "Full-time",
    experienceLevel: "Mid",
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
    experienceLevel: "Senior",
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
    experienceLevel: "Entry",
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
    experienceLevel: "Mid",
    salary: "₹8–12 LPA",
    tags: ["Playwright", "CI", "Automation"],
    posted: "3 days ago",
  },
  {
    id: "job_5",
    title: "Product Designer",
    company: "Aurora Studio",
    location: "Delhi",
    workMode: "Hybrid",
    jobType: "Full-time",
    experienceLevel: "Senior",
    salary: "₹16–26 LPA",
    tags: ["Figma", "UX", "Design Systems"],
    posted: "4 days ago",
  },
];

function normalize(str) {
  return String(str || "").trim().toLowerCase();
}

// PUBLIC_INTERFACE
export default function JobsPage() {
  /** Jobs listing page with filters and a "Save as application" action (in-page search and some filters removed by request). */
  const { state, actions } = useAppState();

  // Filters (kept)
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  const filtered = useMemo(() => {
    return DEMO_JOBS.filter((j) => {
      const matchesJobType = !jobType || j.jobType === jobType;
      const matchesExperience = !experienceLevel || j.experienceLevel === experienceLevel;
      return matchesJobType && matchesExperience;
    });
  }, [jobType, experienceLevel]);

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
      notes: `Saved from Jobs • ${job.workMode} • ${job.jobType} • ${job.experienceLevel}${job.salary ? ` • ${job.salary}` : ""}`,
    });

    actions.pushToast({
      type: "success",
      title: "Saved to Applications",
      description: "You can now manage it in your pipeline.",
    });
  };

  const hasActiveFilters = Boolean(jobType || experienceLevel);

  const activeChips = useMemo(() => {
    const chips = [];
    if (jobType) chips.push({ key: "jt", label: `Type: ${jobType}`, onRemove: () => setJobType("") });
    if (experienceLevel)
      chips.push({ key: "exp", label: `Experience: ${experienceLevel}`, onRemove: () => setExperienceLevel("") });
    return chips;
  }, [jobType, experienceLevel]);

  const resetAll = () => {
    setJobType("");
    setExperienceLevel("");
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
          <div className="field" style={{ maxWidth: 220 }}>
            <label htmlFor="jobTypeFilter">Job type</label>
            <select id="jobTypeFilter" className="select" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="">All</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ maxWidth: 240 }}>
            <label htmlFor="expFilter">Experience</label>
            <select
              id="expFilter"
              className="select"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="">All</option>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="row" style={{ marginLeft: "auto" }}>
            <button className="btn" type="button" onClick={resetAll} disabled={!hasActiveFilters} aria-disabled={!hasActiveFilters}>
              Reset
            </button>
          </div>
        </div>

        {/* Active filters */}
        <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
          <div className="row" style={{ minHeight: 34 }}>
            {activeChips.length ? (
              activeChips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="badge"
                  onClick={c.onRemove}
                  title="Remove filter"
                  style={{
                    cursor: "pointer",
                    borderColor: "rgba(124,58,237,0.22)",
                    background: "rgba(124,58,237,0.08)",
                  }}
                >
                  {c.label} <span style={{ opacity: 0.9, fontWeight: 900 }}>×</span>
                </button>
              ))
            ) : (
              <span className="badge" style={{ opacity: 0.8 }}>
                No active filters
              </span>
            )}
          </div>

          <span className="badge" style={{ borderColor: "rgba(13,148,136,0.25)", background: "rgba(13,148,136,0.08)" }}>
            Dataset: {DEMO_JOBS.length} jobs
          </span>
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
                  {job.jobType} • {job.experienceLevel}
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
              <p>Try resetting filters to broaden results.</p>
              {hasActiveFilters ? (
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="primary-btn" type="button" onClick={resetAll}>
                    Clear filters
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
