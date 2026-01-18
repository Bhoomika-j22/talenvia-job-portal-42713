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
        badgeTone: "violet",
      },
      {
        name: "Engineering",
        title: "Reliable by default",
        description:
          "We build with performance, accessibility, and privacy in mind—keeping core experiences fast and dependable.",
        accent: "from-teal-500/10 to-transparent",
        badge: "Teal",
        badgeTone: "teal",
      },
      {
        name: "Career Insights",
        title: "Guidance that stays practical",
        description:
          "We shape features around real job-search moments—applications, interview prep, and measurable improvement.",
        accent: "from-fuchsia-500/10 to-transparent",
        badge: "Insight",
        badgeTone: "fuchsia",
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

  const badgeStylesByTone = useMemo(
    () => ({
      violet: {
        borderColor: "rgba(124,58,237,0.25)",
        background: "rgba(124,58,237,0.07)",
        color: "#4C1D95",
      },
      teal: {
        borderColor: "rgba(13,148,136,0.25)",
        background: "rgba(13,148,136,0.08)",
        color: "#064E3B",
      },
      fuchsia: {
        borderColor: "rgba(217,70,239,0.22)",
        background: "rgba(217,70,239,0.07)",
        color: "#701A75",
      },
    }),
    []
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10 overflow-hidden relative"
        style={{
          boxShadow: "0 1px 2px rgba(17,24,39,0.06), 0 16px 40px rgba(17,24,39,0.08)",
        }}
      >
        {/* Soft theme wash to better align with Violet Dreams */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(900px circle at 10% 0%, rgba(124,58,237,0.10), transparent 55%), radial-gradient(700px circle at 90% 15%, rgba(13,148,136,0.08), transparent 52%)",
            pointerEvents: "none",
          }}
        />
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-gray-600">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #0D9488)" }}
                  aria-hidden="true"
                />
                Violet Dreams
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">About Talenvia</h1>

              <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
                Talenvia is a career development and job-search platform designed to help professionals manage their
                profile, prepare effectively, and make informed career decisions.
              </p>
            </div>

            {/* Accent chip */}
            <div
              className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
              style={{
                borderColor: "rgba(124,58,237,0.22)",
                background: "rgba(124,58,237,0.06)",
                color: "#4C1D95",
              }}
            >
              <span aria-hidden="true">✦</span>
              Modern &amp; Minimal
            </div>
          </div>

          {/* Divider */}
          <div
            className="mt-8"
            aria-hidden="true"
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, rgba(124,58,237,0.22), rgba(13,148,136,0.18), rgba(17,24,39,0.08))",
            }}
          />

          {/* Mission */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Our Mission</h2>
            <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
              Our mission is to enable individuals to manage their career journey with confidence by providing reliable
              tools for profile building, job preparation, and application tracking.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {[
              {
                title: "Profile Management",
                desc: "Build and maintain a complete professional profile including education, skills, projects, and experience.",
                tone: "violet",
              },
              {
                title: "Job Discovery & Preparation",
                desc: "Discover relevant opportunities and prepare with structured practice, assessments, and guided learning.",
                tone: "teal",
              },
              {
                title: "Privacy & Reliability",
                desc: "Designed with a privacy-first approach to ensure data security, transparency, and trust.",
                tone: "violet",
              },
            ].map((card) => {
              const toneStyles = card.tone === "teal"
                ? {
                    borderColor: "rgba(13,148,136,0.18)",
                    background:
                      "linear-gradient(180deg, rgba(13,148,136,0.08), rgba(255,255,255,0.92))",
                  }
                : {
                    borderColor: "rgba(124,58,237,0.18)",
                    background:
                      "linear-gradient(180deg, rgba(124,58,237,0.08), rgba(255,255,255,0.92))",
                  };

              return (
                <div
                  key={card.title}
                  className="rounded-2xl p-5 sm:p-6 border transition-transform"
                  style={{
                    ...toneStyles,
                    boxShadow: "0 1px 2px rgba(17,24,39,0.06)",
                  }}
                >
                  <h3 className="font-semibold text-gray-900 tracking-tight">{card.title}</h3>
                  <p className="mt-2.5 text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Team */}
          <div className="mt-12">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Our Team</h2>
                <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
                  Talenvia is built by a small, cross-functional team focused on creating calm, consistent tooling for
                  your career journey.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {team.map((m) => (
                <div
                  key={m.name}
                  className="border rounded-2xl p-5 sm:p-6 overflow-hidden relative"
                  style={{
                    borderColor: "rgba(17,24,39,0.12)",
                    boxShadow: "0 1px 2px rgba(17,24,39,0.06)",
                  }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${m.accent}`}
                    aria-hidden="true"
                    style={{ pointerEvents: "none" }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-gray-900 tracking-tight">{m.name}</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full border" style={badgeStylesByTone[m.badgeTone]}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm font-medium text-gray-800">{m.title}</p>
                    <p className="mt-2.5 text-sm text-gray-600 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">FAQ</h2>
            <p className="mt-3 text-gray-600 max-w-3xl leading-relaxed">
              Quick answers to common questions about how Talenvia works and how to get the most from it.
            </p>

            <div className="mt-6 space-y-3">
              {faqs.map((item, idx) => {
                const open = idx === openFaqIndex;
                return (
                  <div
                    key={item.q}
                    className="border rounded-2xl overflow-hidden"
                    style={{ borderColor: open ? "rgba(124,58,237,0.22)" : "rgba(17,24,39,0.12)" }}
                  >
                    <button
                      type="button"
                      className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4"
                      aria-expanded={open}
                      onClick={() => setOpenFaqIndex((prev) => (prev === idx ? -1 : idx))}
                      style={{
                        background: open ? "rgba(124,58,237,0.04)" : "transparent",
                        transition: "background 140ms ease",
                      }}
                    >
                      <div>
                        <div className="font-semibold text-gray-900 leading-snug">{item.q}</div>
                        <div className="mt-1.5 text-sm text-gray-500">Click to {open ? "collapse" : "expand"}</div>
                      </div>
                      <span
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border text-gray-700 shrink-0"
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
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-1">
                        <div
                          className="rounded-xl p-4 text-sm text-gray-600 border leading-relaxed"
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
          <div className="mt-12 pt-6">
            <div
              aria-hidden="true"
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(17,24,39,0.08), rgba(124,58,237,0.20), rgba(17,24,39,0.08))",
              }}
            />
            <p className="mt-6 text-sm text-gray-500 max-w-3xl leading-relaxed">
              Talenvia focuses on clarity, consistency, and long-term growth—helping users take meaningful steps toward
              better career outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
