import React from "react";

// PUBLIC_INTERFACE
export default function HowItWorksPage() {
  /** Explains the Talenvia workflow and features. */
  return (
    <section className="page">
      <h1 className="page-title">How Talenvia Works</h1>
      <p className="page-subtitle">A simple loop: prepare → apply → track → improve.</p>

      <div className="grid">
        <div className="card full">
          <h4>1) Set up your profile</h4>
          <p>
            Add a crisp headline, location, and short bio. This helps you keep your narrative consistent across
            applications and interviews.
          </p>
        </div>

        <div className="card full">
          <h4>2) Capture your skills</h4>
          <p>
            Maintain a living list of skills and proficiency. Use it to focus your mock tests and identify areas to
            strengthen.
          </p>
        </div>

        <div className="card full">
          <h4>3) Practice with mock tests</h4>
          <p>
            Talenvia provides a clean UI for test sessions. In this preview, tests are simulated; connect real questions
            via <code>REACT_APP_API_BASE</code> when a backend is available.
          </p>
        </div>

        <div className="card full">
          <h4>4) Track applications</h4>
          <p>
            Add applications and update statuses (Saved → Applied → Interview → Offer). Keep notes for follow-ups,
            recruiter details, and next actions.
          </p>
        </div>

        <div className="card full">
          <h4>5) Get notified</h4>
          <p>
            Use notifications for reminders and progress. In production, you can integrate push/email/websocket updates
            via <code>REACT_APP_WS_URL</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
