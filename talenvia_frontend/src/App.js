import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { AppStateProvider, useAppState } from "./state/AppState";
import ToastStack from "./components/ToastStack";
import DashboardPage from "./pages/DashboardPage";
import ProfileAndSkillsPage from "./pages/ProfileAndSkillsPage";
import MockTestsPage from "./pages/MockTestsPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import JobsPage from "./pages/JobsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import SearchResultsPage from "./pages/SearchResultsPage";

/**
 * Talenvia React Frontend
 * - Responsive app shell (header, sidebar, main content, footer)
 * - Client-side routing for features pages
 * - Modals and toast notifications
 * - Uses existing REACT_APP_* env vars via Settings page display
 */

function Shell() {
  const { state, actions, toasts, globalSearchQuery } = useAppState();
  const unreadCount = useMemo(() => state.notifications.filter((n) => !n.read).length, [state.notifications]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply theme from settings
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.settings.theme || "light");
  }, [state.settings.theme]);

  const toggleTheme = () => {
    actions.updateSettings({ theme: state.settings.theme === "light" ? "dark" : "light" });
  };

  const submitHeaderSearch = () => {
    actions.submitGlobalSearch(globalSearchQuery);
  };

  return (
    <div className="App">
      <ToastStack toasts={toasts} />
      <div className="shell">
        <header className="header">
          <div className="container header-inner">
            <div className="row header-left" style={{ gap: 10 }}>
              <button
                className="icon-btn"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Toggle navigation"
                type="button"
              >
                ☰
              </button>

              <a className="brand" href="/" onClick={(e) => e.preventDefault()}>
                <span className="brand-badge" aria-hidden="true" />
                <span>
                  Talenvia <small>Job Portal</small>
                </span>
              </a>
            </div>

            <form
              className="header-search"
              role="search"
              aria-label="Global search"
              onSubmit={(e) => {
                e.preventDefault();
                submitHeaderSearch();
              }}
            >
              <div className="search-field">
                <span className="search-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  className="search-input"
                  type="search"
                  value={globalSearchQuery}
                  onChange={(e) => actions.setGlobalSearchQuery(e.target.value)}
                  placeholder="Search jobs, companies, or skills"
                  aria-label="Search jobs, companies, or skills"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitHeaderSearch();
                    }
                  }}
                />
                <button className="search-btn" type="button" onClick={submitHeaderSearch} aria-label="Search">
                  Search
                </button>
              </div>
            </form>

            <div className="header-actions">
              <NavLink className="icon-btn" to="/notifications" aria-label="Notifications">
                🔔 {unreadCount ? <span className="pill" style={{ marginLeft: 8 }}>{unreadCount}</span> : null}
              </NavLink>

              <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme" type="button">
                {state.settings.theme === "light" ? "🌙" : "☀️"}
              </button>

              <button
                className="primary-btn"
                onClick={() =>
                  actions.pushToast({
                    type: "info",
                    title: "Preview mode",
                    description: "This UI uses local storage for demo data. Connect APIs via REACT_APP_API_BASE.",
                  })
                }
                type="button"
              >
                Preview Info
              </button>
            </div>
          </div>
        </header>

        <div className="container shell-body">
          <aside
            className="sidebar"
            style={{
              display: sidebarOpen ? "block" : undefined,
            }}
            aria-label="Sidebar navigation"
          >
            <h3>Navigate</h3>
            <nav className="nav">
              <NavLink to="/" end>
                Dashboard <span className="pill">Home</span>
              </NavLink>
              <NavLink to="/profile-skills">Profile &amp; Skills</NavLink>
              <NavLink to="/jobs">Jobs</NavLink>
              <NavLink to="/mock-tests">Mock Tests</NavLink>
              <NavLink to="/applications">Applications</NavLink>
              <NavLink to="/notifications">
                Notifications {unreadCount ? <span className="pill">{unreadCount}</span> : null}
              </NavLink>
              <NavLink to="/settings">Settings</NavLink>
            </nav>

            <h3 style={{ marginTop: 16 }}>Learn</h3>
            <nav className="nav">
              <NavLink to="/about">About Us</NavLink>
              <NavLink to="/how-it-works">How Talenvia Works</NavLink>
            </nav>

            <div className="card full" style={{ marginTop: 14 }}>
              <h4>Quick actions</h4>
              <p>Add momentum with one small action.</p>
              <div className="row" style={{ marginTop: 10 }}>
                <button
                  className="btn teal"
                  onClick={() =>
                    actions.addNotification({
                      title: "Daily check-in",
                      body: "Log one application update or try a 10-minute mock test today.",
                      type: "info",
                    })
                  }
                  type="button"
                >
                  Create reminder
                </button>
              </div>
            </div>
          </aside>

          <main className="main" aria-label="Main content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/profile-skills" element={<ProfileAndSkillsPage />} />

              {/* Backwards-compatible redirects (old sidebar/page routes) */}
              <Route path="/profile" element={<Navigate to="/profile-skills" replace />} />
              <Route path="/skills" element={<Navigate to="/profile-skills" replace />} />

              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/mock-tests" element={<MockTestsPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route
                path="*"
                element={
                  <section className="page">
                    <h1 className="page-title">Page not found</h1>
                    <p className="page-subtitle">Try using the sidebar to navigate to a valid section.</p>
                  </section>
                }
              />
            </Routes>
          </main>
        </div>

        <footer className="footer">
          <div className="container">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>© {new Date().getFullYear()} Talenvia</span>
              <span style={{ color: "var(--muted)" }}>Violet Dreams • Modern UI • Responsive layout</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** App entry for Talenvia; wraps routes with global state provider. */
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}

export default App;
