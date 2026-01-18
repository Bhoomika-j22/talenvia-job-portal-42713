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
import { ensureUserRow, supabaseHealthCheck } from "./utils/supabaseHelpers";
import { getSupabaseConfigStatus, supabase } from "./lib/supabaseClient";
import { signInWithGoogleOAuth } from "./utils/authHelpers";
import AuthModal from "./components/AuthModal";

/**
 * Talenvia React Frontend
 * - Responsive app shell (header, sidebar, main content, footer)
 * - Client-side routing for features pages
 * - Modals and toast notifications
 * - Uses existing REACT_APP_* env vars via Settings page display
 */

const DESKTOP_BREAKPOINT_PX = 860;

function SidebarIcon({ children, title }) {
  return (
    <span className="nav-icon animate-on-hover" aria-hidden="true" title={title}>
      {children}
    </span>
  );
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M4 13.5V19a1 1 0 0 0 1 1h5.5v-6.5H4ZM13.5 20H19a1 1 0 0 0 1-1v-8h-6.5V20ZM4 11h6.5V4H5a1 1 0 0 0-1 1v6ZM13.5 4v5h6.5V5a1 1 0 0 0-1-1h-5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M16.5 8.2a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4.5 20.2c1.6-3.4 4.4-5.2 7.5-5.2s5.9 1.8 7.5 5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M9 6.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M5.2 7.5h13.6A2.2 2.2 0 0 1 21 9.7v8.6A2.2 2.2 0 0 1 18.8 20.5H5.2A2.2 2.2 0 0 1 3 18.3V9.7A2.2 2.2 0 0 1 5.2 7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 12.2h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconFileCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3.8h7l3 3V20a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 20V5.6A1.8 1.8 0 0 1 7 3.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14 3.8V7h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M8.3 14.1l2 2 5-5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4.8h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 4.8a2 2 0 0 0-2 2V19a2.2 2.2 0 0 0 2.2 2.2h5.6A2.2 2.2 0 0 0 17 19V6.8a2 2 0 0 0-2-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11.3h7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8.5 15.2h5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M18 17.2H6c1.2-1.2 1.7-2.3 1.7-4.4V11a4.3 4.3 0 0 1 8.6 0v1.8c0 2.1.5 3.2 1.7 4.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGear() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.4 12a7.7 7.7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.2 7.2 0 0 0-1.9-1.1l-.4-2.6H9.4L9 5.9c-.7.2-1.3.6-1.9 1.1l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2.2l-2 1.5 2 3.4 2.4-1c.6.5 1.2.9 1.9 1.1l.4 2.6h5.2l.4-2.6c.7-.2 1.3-.6 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.7.1-1.1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 7.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l1.4 4.1L17.5 9l-4.1 1.4L12 14.5l-1.4-4.1L6.5 9l4.1-1.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M19 12.5l.8 2.2 2.2.8-2.2.8L19 18.5l-.8-2.2-2.2-.8 2.2-.8L19 12.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 13l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Shell() {
  const { state, actions, toasts, globalSearchQuery, authUser } = useAppState();
  const unreadCount = useMemo(() => state.notifications.filter((n) => !n.read).length, [state.notifications]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signin"); // 'signin' | 'signup'

  const avatarUrl =
    authUser?.user_metadata?.avatar_url ||
    authUser?.user_metadata?.picture ||
    authUser?.user_metadata?.avatar ||
    null;

  // Responsive default:
  // - desktop: visible
  // - small screens: hidden (drawer)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX + 1}px)`).matches;
  });

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX + 1}px)`).matches;
  });

  // Apply theme from settings
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.settings.theme || "light");
  }, [state.settings.theme]);

  // Supabase session + auth events:
  // - On initial load, read existing session (including one set via OAuth redirect).
  // - Subscribe to auth state changes.
  // - After sign-in, ensure `public.users` row exists (required for RLS-backed profile sync).
  useEffect(() => {
    let cancelled = false;

    const status = getSupabaseConfigStatus();
    if (!status.configured || !supabase) return undefined;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          actions.pushToast({ type: "error", title: "Auth error", description: error.message });
          return;
        }
        if (!cancelled && data?.session) {
          actions.setAuthSession(data.session);
        }
      } catch {
        // no-op: keep UI functional
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      actions.setAuthSession(session || null);

      if (event === "SIGNED_IN" && session?.user?.id) {
        actions.pushToast({
          type: "success",
          title: "Signed in",
          description: `Welcome${session.user.email ? `, ${session.user.email}` : ""}!`,
          ttlMs: 2200,
        });

        try {
          await ensureUserRow({
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
            email: session.user.email || null,
            profile_photo_url: session.user.user_metadata?.avatar_url || null,
          });
        } catch (e) {
          actions.pushToast({
            type: "error",
            title: "Profile setup failed",
            description: e instanceof Error ? e.message : String(e),
            ttlMs: 5000,
          });
        }
      }

      if (event === "SIGNED_OUT") {
        actions.pushToast({ type: "info", title: "Signed out", description: "You have been signed out." });
      }
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [actions]);

  // Non-blocking Supabase check (scaffold only; does not change any features/routes/UI).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // First: if env vars are missing, surface a helpful toast once (non-blocking).
      const status = getSupabaseConfigStatus();
      if (!cancelled && !status.configured) {
        actions.pushToast({
          type: "info",
          title: "Supabase not configured",
          description: `Missing env: ${status.missing.join(", ")}. Cloud sync will be disabled.`,
          ttlMs: 5000,
        });
        return;
      }

      const res = await supabaseHealthCheck();

      // Only show a small toast when configured + reachable.
      if (!cancelled && res.ok) {
        actions.pushToast({
          type: "success",
          title: "Supabase connected",
          description: res.hasSession ? "Session detected." : "No session (ready).",
          ttlMs: 1800,
        });
      }
    })().catch(() => {
      // Intentionally swallow all errors (do not break app and avoid noisy UI).
    });

    return () => {
      cancelled = true;
    };
  }, [actions]);

  // Keep the sidebar default in sync with viewport:
  // - When resizing to desktop => open
  // - When resizing to mobile  => close
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX + 1}px)`);
    const onChange = (e) => {
      const nextIsDesktop = e.matches;
      setIsDesktop(nextIsDesktop);
      setSidebarOpen(nextIsDesktop ? true : false);
    };

    // Initialize from MQ in case it differs from initial render.
    setIsDesktop(mq.matches);
    setSidebarOpen(mq.matches ? true : false);

    // Cross-browser MQ listener support.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  // Prevent background scrolling when the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isDesktop) return; // desktop sidebar is part of layout; no scroll locking
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen, isDesktop]);

  const toggleTheme = () => {
    actions.updateSettings({ theme: state.settings.theme === "light" ? "dark" : "light" });
  };

  const submitHeaderSearch = () => {
    actions.submitGlobalSearch(globalSearchQuery);
  };

  // PUBLIC_INTERFACE
  const toggleSidebar = () => {
    /** Toggles sidebar visibility without page reload; used by header hamburger and overlay. */
    setSidebarOpen((v) => !v);
  };

  return (
    <div className="App">
      <ToastStack toasts={toasts} />
      <div className="shell">
        <header className="header">
          <div className="container header-inner">
            <div className="row header-left" style={{ gap: 10 }}>
              <button
                className={`icon-btn hamburger ${sidebarOpen ? "is-open" : ""}`}
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={sidebarOpen}
                aria-controls="app-sidebar"
                type="button"
              >
                <span className="hamburger-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
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

              {!authUser ? (
                <>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      setAuthModalMode("signin");
                      setAuthModalOpen(true);
                    }}
                  >
                    Sign in
                  </button>

                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => {
                      setAuthModalMode("signup");
                      setAuthModalOpen(true);
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  <div className="user-chip" title={authUser.email || "Signed in"}>
                    {avatarUrl ? <img className="avatar" src={avatarUrl} alt="" /> : <span aria-hidden="true">👤</span>}
                    <span className="user-email">{authUser.email || "Signed in"}</span>
                  </div>

                  <button
                    className="btn danger"
                    type="button"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          actions.pushToast({
                            type: "error",
                            title: "Supabase not configured",
                            description: "Missing REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_KEY.",
                          });
                          return;
                        }
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                          console.error("[Supabase Auth] signOut error", JSON.stringify(error, null, 2));
                          actions.pushToast({
                            type: "error",
                            title: "Sign out failed",
                            description: error.message || "Unable to sign out.",
                          });
                        }
                        // Success toast handled by onAuthStateChange SIGNED_OUT
                      } catch (e) {
                        console.error("[Supabase Auth] signOut exception", e);
                        actions.pushToast({
                          type: "error",
                          title: "Sign out failed",
                          description: e instanceof Error ? e.message : String(e),
                        });
                      }
                    }}
                  >
                    Sign out
                  </button>
                </>
              )}

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

        {authModalOpen ? (
          <AuthModal
            mode={authModalMode}
            actions={actions}
            onClose={() => {
              setAuthModalOpen(false);
            }}
          />
        ) : null}

        {/* Mobile overlay (drawer mode) */}
        <button
          className={`sidebar-overlay ${!isDesktop && sidebarOpen ? "is-open" : ""}`}
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setSidebarOpen(false)}
        />

        <div className={`container shell-body ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
          <aside
            id="app-sidebar"
            className={`sidebar ${sidebarOpen ? "is-open" : "is-closed"} ${isDesktop ? "is-desktop" : "is-drawer"}`}
            aria-label="Sidebar navigation"
          >
            <h3>Navigate</h3>
            <nav className="nav">
              <NavLink
                to="/"
                end
                onClick={() => {
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="Dashboard">
                    <IconDashboard />
                  </SidebarIcon>
                  <span className="nav-label">Dashboard</span>
                </span>
                <span className="pill">Home</span>
              </NavLink>

              <NavLink
                to="/profile-skills"
                onClick={() => {
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="Profile & Skills">
                    <IconUser />
                  </SidebarIcon>
                  <span className="nav-label">Profile &amp; Skills</span>
                </span>
              </NavLink>

              <NavLink
                to="/jobs"
                onClick={() => {
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="Jobs">
                    <IconBriefcase />
                  </SidebarIcon>
                  <span className="nav-label">Jobs</span>
                </span>
              </NavLink>

              <NavLink
                to="/applications"
                onClick={() => {
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="Applications">
                    <IconFileCheck />
                  </SidebarIcon>
                  <span className="nav-label">Applications</span>
                </span>
              </NavLink>

              <NavLink
                to="/mock-tests"
                onClick={() => {
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="Mock Tests">
                    <IconClipboard />
                  </SidebarIcon>
                  <span className="nav-label">Mock Tests</span>
                </span>
              </NavLink>

              <NavLink
                to="/settings"
                onClick={() => {
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="Settings">
                    <IconGear />
                  </SidebarIcon>
                  <span className="nav-label">Settings</span>
                </span>
              </NavLink>

              <NavLink
                to="/notifications"
                onClick={() => {
                  // In drawer mode, close after navigation for dashboard-like UX.
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="Notifications">
                    <IconBell />
                  </SidebarIcon>
                  <span className="nav-label">Notifications</span>
                </span>
                {unreadCount ? <span className="pill">{unreadCount}</span> : null}
              </NavLink>
            </nav>

            <h3 style={{ marginTop: 16 }}>Learn</h3>
            <nav className="nav">
              <NavLink
                to="/about"
                onClick={() => {
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="About">
                    <IconInfo />
                  </SidebarIcon>
                  <span className="nav-label">About</span>
                </span>
              </NavLink>
              <NavLink
                to="/how-it-works"
                onClick={() => {
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <span className="nav-left">
                  <SidebarIcon title="How It Works">
                    <IconSparkles />
                  </SidebarIcon>
                  <span className="nav-label">How It Works</span>
                </span>
              </NavLink>
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
