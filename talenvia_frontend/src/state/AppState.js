import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadAppState, saveAppState } from "../utils/storage";

/**
 * App-wide state for Talenvia.
 * This is intentionally lightweight (no external state library) to match template constraints.
 */

const AppStateContext = createContext(null);

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function AppStateProviderInner({ children }) {
  /** Internal provider implementation; use AppStateProvider (router-aware wrapper) instead. */
  const [state, setState] = useState(() => loadAppState());
  const [toasts, setToasts] = useState([]);

  // Router navigation for global search (keeps header search UX consistent across pages).
  const navigate = useNavigate();

  // Global header search state (client-side; no navigation/reload required).
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Persist state changes
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const pushToast = (toast) => {
    const id = toast.id || makeId("toast");
    const next = {
      id,
      title: toast.title || "Update",
      description: toast.description || "",
      type: toast.type || "info",
      ttlMs: typeof toast.ttlMs === "number" ? toast.ttlMs : 3500,
    };

    setToasts((prev) => [next, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, next.ttlMs);
  };

  const actions = useMemo(() => {
    return {
      // PUBLIC_INTERFACE
      updateProfile(profilePatch) {
        /** Updates the user's profile fields. */
        setState((prev) => ({ ...prev, profile: { ...prev.profile, ...profilePatch } }));
        pushToast({ type: "success", title: "Profile updated", description: "Your changes were saved." });
      },

      // PUBLIC_INTERFACE
      addSkill(skill) {
        /** Adds a skill with level. */
        setState((prev) => ({ ...prev, skills: [{ name: skill.name, level: skill.level }, ...prev.skills] }));
        pushToast({ type: "success", title: "Skill added", description: `${skill.name} (${skill.level})` });
      },

      // PUBLIC_INTERFACE
      removeSkill(name) {
        /** Removes a skill by name. */
        setState((prev) => ({ ...prev, skills: prev.skills.filter((s) => s.name !== name) }));
        pushToast({ type: "info", title: "Skill removed", description: name });
      },

      // PUBLIC_INTERFACE
      startMockTest(testId) {
        /** Starts a mock test and records attempt time. */
        setState((prev) => ({
          ...prev,
          mockTests: prev.mockTests.map((t) =>
            t.id === testId ? { ...t, status: "In progress", lastAttempt: new Date().toISOString() } : t
          ),
        }));
        pushToast({ type: "info", title: "Mock test started", description: "Good luck — you’ve got this." });
      },

      // PUBLIC_INTERFACE
      submitMockTest(testId, score) {
        /** Completes a mock test with a score. */
        setState((prev) => ({
          ...prev,
          mockTests: prev.mockTests.map((t) =>
            t.id === testId
              ? { ...t, status: "Completed", score, lastAttempt: new Date().toISOString() }
              : t
          ),
          notifications: [
            {
              id: makeId("n"),
              title: "Mock test completed",
              body: `You scored ${score}%. Review answers and try again soon.`,
              type: score >= 70 ? "success" : "info",
              ts: Date.now(),
              read: false,
            },
            ...prev.notifications,
          ],
        }));
        pushToast({ type: "success", title: "Mock submitted", description: `Score: ${score}%` });
      },

      // PUBLIC_INTERFACE
      addApplication(app) {
        /** Adds a job application to tracking. */
        const newApp = {
          id: makeId("app"),
          company: app.company,
          role: app.role,
          status: app.status || "Saved",
          appliedOn: app.appliedOn || new Date().toISOString().slice(0, 10),
          notes: app.notes || "",
        };
        setState((prev) => ({ ...prev, applications: [newApp, ...prev.applications] }));
        pushToast({ type: "success", title: "Application added", description: `${newApp.company} • ${newApp.role}` });
      },

      // PUBLIC_INTERFACE
      updateApplication(id, patch) {
        /** Updates an application by id. */
        setState((prev) => ({
          ...prev,
          applications: prev.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }));
        pushToast({ type: "success", title: "Application updated", description: "Tracking details saved." });
      },

      // PUBLIC_INTERFACE
      removeApplication(id) {
        /** Removes an application by id. */
        setState((prev) => ({ ...prev, applications: prev.applications.filter((a) => a.id !== id) }));
        pushToast({ type: "info", title: "Application removed", description: "Item deleted." });
      },

      // PUBLIC_INTERFACE
      updateSettings(patch) {
        /** Updates settings (theme, notifications). */
        setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
        pushToast({ type: "success", title: "Settings updated", description: "Preferences saved." });
      },

      // PUBLIC_INTERFACE
      markNotificationRead(id) {
        /** Marks a notification as read. */
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      // PUBLIC_INTERFACE
      addNotification(notification) {
        /** Adds a new notification. */
        setState((prev) => ({
          ...prev,
          notifications: [{ id: makeId("n"), ts: Date.now(), read: false, ...notification }, ...prev.notifications],
        }));
        pushToast({ type: "info", title: "Notification", description: notification.title || "New update" });
      },

      // PUBLIC_INTERFACE
      setGlobalSearchQuery(query) {
        /** Updates the global search query shown in the header search bar. */
        setGlobalSearchQuery(query);
      },

      // PUBLIC_INTERFACE
      submitGlobalSearch(query) {
        /**
         * Triggers a client-side search action for the given query.
         * - No page reload.
         * - Navigates to the dedicated Search Results page for consistent UX.
         */
        const q = String(query || "").trim();
        if (!q) {
          pushToast({ type: "info", title: "Search", description: "Type something to search." });
          return;
        }

        // Navigate to a dedicated results route so users can bookmark/share searches.
        navigate(`/search?q=${encodeURIComponent(q)}`);

        // Keep minimal feedback (header remains uncluttered).
        pushToast({ type: "info", title: "Search", description: `Searching for: ${q}` });
      },

      // PUBLIC_INTERFACE
      pushToast,
    };
  }, []);

  const value = useMemo(
    () => ({ state, setState, actions, toasts, globalSearchQuery }),
    [state, actions, toasts, globalSearchQuery]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// PUBLIC_INTERFACE
export function AppStateProvider({ children }) {
  /** Router-aware app state provider (required for global search navigation). */
  return <AppStateProviderInner>{children}</AppStateProviderInner>;
}

// PUBLIC_INTERFACE
export function useAppState() {
  /** Hook for accessing Talenvia app state and actions. */
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
