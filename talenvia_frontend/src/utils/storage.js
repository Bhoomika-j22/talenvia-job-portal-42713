/**
 * Local storage helpers for Talenvia mock data.
 */

const KEY = "talenvia:v1";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function getDefaultState() {
  return {
    profile: {
      fullName: "Aisha Rahman",
      email: "aisha@example.com",
      headline: "Frontend Engineer • React • UI Systems",
      location: "Remote / Bengaluru",
      bio:
        "Building delightful, accessible products. Use Talenvia to organize your job search, practice mock tests, and track applications.",
    },
    skills: [
      { name: "React", level: "Advanced" },
      { name: "JavaScript", level: "Advanced" },
      { name: "CSS", level: "Advanced" },
      { name: "TypeScript", level: "Intermediate" },
    ],
    mockTests: [
      {
        id: "mt-1",
        title: "React Fundamentals (15 mins)",
        status: "Not started",
        score: null,
        lastAttempt: null,
      },
      {
        id: "mt-2",
        title: "JavaScript Algorithms (20 mins)",
        status: "Not started",
        score: null,
        lastAttempt: null,
      },
      {
        id: "mt-3",
        title: "CSS Layout & Responsive Design (12 mins)",
        status: "Not started",
        score: null,
        lastAttempt: null,
      },
      {
        id: "mt-4",
        title: "TypeScript Essentials (18 mins)",
        status: "Not started",
        score: null,
        lastAttempt: null,
      },
      {
        id: "mt-5",
        title: "System Design Basics (25 mins)",
        status: "Not started",
        score: null,
        lastAttempt: null,
      },
      {
        id: "mt-6",
        title: "Behavioral Interview Prep (10 mins)",
        status: "Not started",
        score: null,
        lastAttempt: null,
      },
      {
        id: "mt-7",
        title: "Data Structures: Arrays & Hash Maps (15 mins)",
        status: "Not started",
        score: null,
        lastAttempt: null,
      },
      {
        id: "mt-8",
        title: "Debugging & Code Reading (14 mins)",
        status: "Not started",
        score: null,
        lastAttempt: null,
      },
    ],
    applications: [
      {
        id: "app-1",
        company: "Violet Labs",
        role: "Frontend Engineer",
        status: "Applied",
        appliedOn: "2026-01-10",
        notes: "Follow up after 1 week. Emphasize design systems experience.",
      },
      {
        id: "app-2",
        company: "TealWorks",
        role: "UI Engineer",
        status: "Interview",
        appliedOn: "2026-01-05",
        notes: "Mock interview scheduled. Review accessibility patterns.",
      },
    ],
    settings: {
      theme: "light",
      notificationsEnabled: true,
      weeklyDigest: true,
    },
    notifications: [
      {
        id: "n-1",
        title: "Weekly Digest Ready",
        body: "You have 2 active applications and 2 mock tests pending. Keep going!",
        type: "info",
        ts: Date.now() - 1000 * 60 * 45,
        read: false,
      },
    ],
  };
}

// PUBLIC_INTERFACE
export function loadAppState() {
  /** Loads Talenvia state from localStorage, falling back to defaults. */
  const raw = localStorage.getItem(KEY);
  if (!raw) return getDefaultState();
  const parsed = safeParse(raw, null);
  if (!parsed) return getDefaultState();
  return { ...getDefaultState(), ...parsed };
}

// PUBLIC_INTERFACE
export function saveAppState(state) {
  /** Saves Talenvia state to localStorage. */
  localStorage.setItem(KEY, JSON.stringify(state));
}
