import React, { useMemo } from "react";

/**
 * AboutTalenvia component used as the About Us page content.
 */

// PUBLIC_INTERFACE
export default function AboutTalenvia() {
  /** Render About Talenvia content (enterprise-style cards). */

  const cards = useMemo(
    () => [
      {
        title: "Profile Management",
        description:
          "Build and maintain a complete professional profile including education, skills, projects, and experience.",
      },
      {
        title: "Job Discovery & Preparation",
        description:
          "Discover relevant opportunities and prepare using structured practice, assessments, and guided learning.",
      },
      {
        title: "Privacy & Reliability",
        description:
          "Designed with a privacy-first approach to ensure data security, transparency, and trust.",
      },
    ],
    []
  );

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "8px 0" }}>
      <header style={{ padding: "8px 6px 14px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--text)",
            fontWeight: 750,
          }}
        >
          About Talenvia
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            color: "var(--muted)",
            maxWidth: 760,
            fontSize: 14.5,
            lineHeight: 1.6,
          }}
        >
          Talenvia is a career platform designed to help you maintain a strong profile,
          discover relevant roles, and prepare with consistent structure.
        </p>
      </header>

      <section
        aria-label="Talenvia capabilities"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 14,
          padding: 6,
        }}
      >
        {cards.map((card) => (
          <article
            key={card.title}
            style={{
              gridColumn: "span 12",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 18,
              boxShadow: "var(--shadow-sm)",
            }}
          >
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
              {card.title}
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                color: "var(--muted)",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {card.description}
            </p>
          </article>
        ))}
      </section>

      {/* Responsive columns: 3-up on desktop, stacked on mobile */}
      <style>
        {`
          @media (min-width: 900px) {
            section[aria-label="Talenvia capabilities"] > article {
              grid-column: span 4;
            }
          }
        `}
      </style>
    </div>
  );
}
