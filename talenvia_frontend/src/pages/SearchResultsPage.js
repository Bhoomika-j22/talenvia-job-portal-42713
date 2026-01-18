import React, { useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState";

/**
 * Search Results page
 * - Dedicated route for global header search.
 * - Reads query from URL (?q=...) to allow direct linking + browser navigation.
 * - Shows three sections: Jobs, Companies, Skills (client-side filtering).
 *
 * Notes:
 * - This app currently uses in-memory demo data on Jobs page + local-storage app state.
 * - When backend search is added, this page can be updated to call APIs instead.
 */

// Keep demo data local and lightweight; matches JobsPage demo entries.
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

function uniq(arr) {
  return Array.from(new Set(arr)).filter(Boolean);
}

function useQueryParam(name) {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search).get(name) || "", [location.search, name]);
}

// PUBLIC_INTERFACE
export default function SearchResultsPage() {
  /** Dedicated search results page for the global header search. */
  const { state, actions } = useAppState();
  const navigate = useNavigate();
  const q = useQueryParam("q");
  const query = useMemo(() => String(q || "").trim(), [q]);

  // Keep header search input in sync with URL query when arriving via navigation/back-forward.
  useEffect(() => {
    actions.setGlobalSearchQuery(query);
  }, [actions, query]);

  const jobs = useMemo(() => {
    const n = normalize(query);
    if (!n) return [];
    return DEMO_JOBS.filter((j) => {
      return (
        normalize(j.title).includes(n) ||
        normalize(j.company).includes(n) ||
        normalize(j.location).includes(n) ||
        normalize(j.jobType).includes(n) ||
        normalize(j.experienceLevel).includes(n) ||
        normalize(j.workMode).includes(n) ||
        (j.tags || []).some((t) => normalize(t).includes(n))
      );
    });
  }, [query]);

  const companies = useMemo(() => {
    if (!query) return [];
    const n = normalize(query);
    const pool = uniq(DEMO_JOBS.map((j) => j.company));
    return pool.filter((c) => normalize(c).includes(n));
  }, [query]);

  const skills = useMemo(() => {
    if (!query) return [];
    const n = normalize(query);
    return (state.skills || []).filter((s) => normalize(s.name).includes(n));
  }, [query, state.skills]);

  const isEmpty = !query;
  const totalHits = (query ? jobs.length + companies.length + skills.length : 0) || 0;

  return (
    <section className="page">
      <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Search Results</h1>
          <p className="page-subtitle">
            {isEmpty
              ? "Type a query in the header search to find jobs, companies, and skills."
              : `Showing matches for “${query}”.`}
          </p>
        </div>

        <div className="row" style={{ gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span className="badge" title="Total matched items">
            {isEmpty ? "No query" : `${totalHits} matches`}
          </span>
          <NavLink className="btn" to="/jobs">
            Browse Jobs
          </NavLink>
        </div>
      </div>

      {isEmpty ? (
        <div className="card full" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Try searching for:</h3>
          <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
            {["React", "Remote", "Nimbus", "SQL", "Design"].map((s) => (
              <button
                key={s}
                type="button"
                className="badge"
                onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                style={{
                  cursor: "pointer",
                  borderColor: "rgba(124,58,237,0.22)",
                  background: "rgba(124,58,237,0.08)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <p style={{ marginTop: 12, color: "var(--muted)" }}>
            Tip: press <strong>Enter</strong> in the header search to jump here.
          </p>
        </div>
      ) : null}

      {!isEmpty && totalHits === 0 ? (
        <div className="card full" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>No results found</h3>
          <p>Try a different keyword, or browse Jobs to explore the demo dataset.</p>
          <div className="row" style={{ marginTop: 12, gap: 10 }}>
            <NavLink className="primary-btn" to="/jobs">
              Go to Jobs
            </NavLink>
            <button
              className="btn"
              type="button"
              onClick={() => {
                actions.setGlobalSearchQuery("");
                navigate("/search");
              }}
            >
              Clear search
            </button>
          </div>
        </div>
      ) : null}

      {/* Jobs */}
      {!isEmpty ? (
        <div className="card full" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Jobs</h3>
            <span className="badge">{jobs.length} matches</span>
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            {jobs.slice(0, 6).map((job) => (
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

                <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                  {(job.tags || []).slice(0, 4).map((t) => (
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
                  <NavLink className="btn" to="/jobs">
                    View in Jobs
                  </NavLink>
                </div>
              </div>
            ))}

            {jobs.length === 0 ? (
              <div className="card full">
                <p style={{ marginTop: 0 }}>No job matches.</p>
              </div>
            ) : null}

            {jobs.length > 6 ? (
              <div className="card full">
                <p style={{ marginTop: 0, color: "var(--muted)" }}>
                  Showing 6 of {jobs.length} job matches. Use the Jobs page for deeper filtering.
                </p>
                <NavLink className="primary-btn" to="/jobs">
                  Open Jobs
                </NavLink>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Companies */}
      {!isEmpty ? (
        <div className="card full" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Companies</h3>
            <span className="badge">{companies.length} matches</span>
          </div>

          <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
            {companies.map((c) => (
              <span
                key={c}
                className="badge"
                style={{
                  borderColor: "rgba(13,148,136,0.25)",
                  background: "rgba(13,148,136,0.08)",
                }}
              >
                {c}
              </span>
            ))}
            {companies.length === 0 ? <span className="badge">No company matches</span> : null}
          </div>
        </div>
      ) : null}

      {/* Skills */}
      {!isEmpty ? (
        <div className="card full" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Skills</h3>
            <span className="badge">{skills.length} matches</span>
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            {skills.map((s) => (
              <div key={s.name} className="card">
                <h4 style={{ marginTop: 0 }}>{s.name}</h4>
                <p style={{ marginTop: 8, color: "var(--muted)" }}>Level: {s.level}</p>
                <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                  <NavLink className="btn" to="/profile-skills">
                    View in Profile &amp; Skills
                  </NavLink>
                </div>
              </div>
            ))}
            {skills.length === 0 ? (
              <div className="card full">
                <p style={{ marginTop: 0 }}>No skill matches in your profile yet.</p>
                <NavLink className="primary-btn" to="/profile-skills">
                  Add skills
                </NavLink>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
