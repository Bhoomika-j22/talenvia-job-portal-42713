import React from "react";

// PUBLIC_INTERFACE
export default function AboutPage() {
  /** About Talenvia page. */
  return (
    <section className="page">
      <h1 className="page-title">About Talenvia</h1>
      <p className="page-subtitle">
        A modern job-search companion that blends organization, practice, and clarity.
      </p>

      <div className="grid">
        <div className="card full">
          <h4>Our mission</h4>
          <p>
            Talenvia helps candidates stay confident and consistent: manage your profile, sharpen skills, practice mock
            tests, and track applications—without juggling spreadsheets and tabs.
          </p>
        </div>

        <div className="card third">
          <h4>Violet Dreams design</h4>
          <p>
            Calm surfaces, soft gradients, and purple-teal accents make the workflow feel focused and optimistic.
          </p>
        </div>

        <div className="card third">
          <h4>Privacy-first</h4>
          <p>
            This preview stores data locally in your browser. Backend integrations can be added via environment-driven
            endpoints.
          </p>
        </div>

        <div className="card third">
          <h4>Built for momentum</h4>
          <p>
            Small actions add up—one mock test, one application update, one follow-up at a time.
          </p>
        </div>
      </div>
    </section>
  );
}
