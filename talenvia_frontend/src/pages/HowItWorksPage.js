import React, { useMemo } from "react";

/**
 * HowItWorksPage
 * Renders an enterprise-style, step-based explanation of the Talenvia user journey.
 */

// PUBLIC_INTERFACE
export default function HowItWorksPage() {
  /** Explains the Talenvia workflow and features. */

  const steps = useMemo(
    () => [
      {
        number: "01",
        title: "Create Your Profile",
        description:
          "Users build a complete professional profile by adding basic details, education, skills, projects, experience, languages, and a profile summary. This profile becomes the foundation for job matching and recommendations.",
      },
      {
        number: "02",
        title: "Discover Relevant Jobs",
        description:
          "Talenvia shows job opportunities based on the user’s profile, skills, and preferences. Users can explore roles, save jobs, and apply directly from the platform.",
      },
      {
        number: "03",
        title: "Prepare with Mock Tests & Practice",
        description:
          "Users strengthen their readiness through mock tests, skill-based assessments, and interview-focused practice designed to improve consistency and confidence.",
      },
      {
        number: "04",
        title: "Track Applications in One Place",
        description:
          "Every application is tracked across stages like saved, applied, interview, offer, and rejected—helping users stay organized without spreadsheets or external tools.",
      },
      {
        number: "05",
        title: "Improve with AI Guidance",
        description:
          "Talenvia provides AI-powered insights to help users understand skill gaps, improve profiles, prepare for interviews, and make better career decisions.",
      },
    ],
    []
  );

  return (
    <section className="page">
      <header style={{ padding: "2px 4px 10px" }}>
        <h1 className="page-title">How Talenvia Works</h1>
        <p className="page-subtitle" style={{ maxWidth: 820 }}>
          A clear workflow built for real job seekers—from building a strong profile to improving with targeted guidance.
        </p>
      </header>

      <section
        aria-label="How Talenvia works steps"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 14,
          padding: 6,
        }}
      >
        {steps.map((step) => (
          <article
            key={step.number}
            className="talenvia-step-card"
            style={{
              gridColumn: "span 12",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              borderRadius: 14,
              padding: 18,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                    fontWeight: 750,
                    color: "var(--text)",
                  }}
                >
                  {step.title}
                </h2>
              </div>

              <div
                aria-hidden="true"
                style={{
                  flex: "0 0 auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 30,
                  padding: "0 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(124, 58, 237, 0.22)",
                  background: "rgba(124, 58, 237, 0.10)",
                  color: "var(--text)",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                }}
                title={`Step ${step.number}`}
              >
                STEP {step.number}
              </div>
            </div>

            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: 14,
                lineHeight: 1.6,
                maxWidth: 920,
              }}
            >
              {step.description}
            </p>
          </article>
        ))}
      </section>

      {/* Responsive columns: 2-up on larger screens, stacked on mobile */}
      <style>
        {`
          @media (min-width: 900px) {
            section[aria-label="How Talenvia works steps"] > .talenvia-step-card {
              grid-column: span 6;
            }
          }
        `}
      </style>
    </section>
  );
}
