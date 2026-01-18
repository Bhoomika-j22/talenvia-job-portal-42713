import React, { useMemo, useState } from "react";

/**
 * AboutTalenvia component used as the About Us page content.
 */

// PUBLIC_INTERFACE
export default function AboutTalenvia() {
  /** Render About Talenvia content. */

  const team = useMemo(
    () => [
      {
        name: "Product & UX",
        title: "Designing clarity first",
        description:
          "We focus on clean workflows that reduce friction—so you spend less time organizing and more time progressing.",
        accent: "from-violet-500/10 to-transparent",
        badge: "Violet",
      },
      {
        name: "Engineering",
        title: "Reliable by default",
        description:
          "We build with performance, accessibility, and privacy in mind—keeping core experiences fast and dependable.",
        accent: "from-teal-500/10 to-transparent",
        badge: "Teal",
      },
      {
        name: "Career Insights",
        title: "Guidance that stays practical",
        description:
          "We shape features around real job-search moments—applications, interview prep, and measurable improvement.",
        accent: "from-fuchsia-500/10 to-transparent",
        badge: "Insight",
      },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: "Is Talenvia a job board or a career platform?",
        a: "Talenvia is both: it helps you discover opportunities while also supporting your long-term career growth with profile building, preparation, and application tracking.",
      },
      {
        q: "Do I need to complete my profile to start using Talenvia?",
        a: "No. You can start exploring immediately, and then gradually improve your profile to get more relevant matches and stronger application materials.",
      },
      {
        q: "How does Talenvia handle my data and privacy?",
        a: "We take a privacy-first approach. Your information is used to power your experience, and the platform is designed to prioritize security and transparency.",
      },
      {
        q: "What’s the fastest way to see value from Talenvia?",
        a: "Pick one small workflow: add 3 skills, try a mock test, or log one application update. The dashboard and reminders are designed to help you keep momentum.",
      },
    ],
    []
  );

  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-900">About Talenvia</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Talenvia is a career development and job-search platform designed to help professionals manage their profile,
          prepare effectively, and make informed career decisions.
        </p>

        {/* Mission */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Our Mission</h2>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Our mission is to enable individuals to manage their career journey with confidence by providing reliable
            tools for profile building, job preparation, and application tracking.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-xl p-5">
            <h3 className="font-semibold text-gray-900">Profile Management</h3>
            <p className="mt-2 text-sm text-gray-600">
              Build and maintain a complete professional profile including education, skills, projects, and experience.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h3 className="font-semibold text-gray-900">Job Discovery &amp; Preparation</h3>
            <p className="mt-2 text-sm text-gray-600">
              Discover relevant opportunities and prepare with structured practice, assessments, and guided learning.
            </p>
          </div>

          <div className="border rounded-xl p-5">
            <h3 className="font-semibold text-gray-900">Privacy &amp; Reliability</h3>
            <p className="mt-2 text-sm text-gray-600">
              Designed with a privacy-first approach to ensure data security, transparency, and trust.
            </p>
          </div>
        </div>

        {/* Team */}
        <div className="mt-12">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Our Team</h2>
              <p className="mt-2 text-gray-600 max-w-3xl">
                Talenvia is built by a small, cross-functional team focused on creating calm, consistent tooling for your
                career journey.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#7C3AED" }} aria-hidden="true" />
                Violet Dreams
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((m) => (
              <div key={m.name} className="border rounded-xl p-5 overflow-hidden relative">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${m.accent}`}
                  aria-hidden="true"
                  style={{ pointerEvents: "none" }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">{m.name}</h3>
                    <span
                      className="text-xs px-2 py-1 rounded-full border"
                      style={{
                        borderColor: "rgba(124,58,237,0.25)",
                        background: "rgba(124,58,237,0.06)",
                        color: "#4C1D95",
                      }}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-800">{m.title}</p>
                  <p className="mt-2 text-sm text-gray-600">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">FAQ</h2>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Quick answers to common questions about how Talenvia works and how to get the most from it.
          </p>

          <div className="mt-6 space-y-3">
            {faqs.map((item, idx) => {
              const open = idx === openFaqIndex;
              return (
                <div key={item.q} className="border rounded-xl">
                  <button
                    type="button"
                    className="w-full text-left p-5 flex items-start justify-between gap-4"
                    aria-expanded={open}
                    onClick={() => setOpenFaqIndex((prev) => (prev === idx ? -1 : idx))}
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{item.q}</div>
                      <div className="mt-1 text-sm text-gray-500">Click to {open ? "collapse" : "expand"}</div>
                    </div>
                    <span
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border text-gray-700"
                      style={{
                        borderColor: open ? "rgba(124,58,237,0.35)" : "rgba(17,24,39,0.12)",
                        background: open ? "rgba(124,58,237,0.06)" : "transparent",
                      }}
                      aria-hidden="true"
                    >
                      {open ? "–" : "+"}
                    </span>
                  </button>

                  {open ? (
                    <div className="px-5 pb-5 -mt-2">
                      <div
                        className="rounded-lg p-4 text-sm text-gray-600 border"
                        style={{
                          borderColor: "rgba(13,148,136,0.25)",
                          background: "rgba(13,148,136,0.06)",
                        }}
                      >
                        {item.a}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-12 border-t pt-6">
          <p className="text-sm text-gray-500 max-w-3xl">
            Talenvia focuses on clarity, consistency, and long-term growth—helping users take meaningful steps toward
            better career outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}
