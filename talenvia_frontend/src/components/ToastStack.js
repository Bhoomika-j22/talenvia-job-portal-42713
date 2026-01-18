import React from "react";

// PUBLIC_INTERFACE
export default function ToastStack({ toasts }) {
  /** Renders non-blocking notification popups (toasts). */
  return (
    <div className="toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <h4 className="toast-title">{t.title}</h4>
          {t.description ? <p className="toast-desc">{t.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
