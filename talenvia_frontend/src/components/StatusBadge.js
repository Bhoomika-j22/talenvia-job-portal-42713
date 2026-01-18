import React from "react";

const STATUS_META = {
  Saved: { label: "Saved", color: "info" },
  Applied: { label: "Applied", color: "info" },
  Interview: { label: "Interview", color: "success" },
  Offer: { label: "Offer", color: "success" },
  Rejected: { label: "Rejected", color: "error" },
};

// PUBLIC_INTERFACE
export default function StatusBadge({ status }) {
  /** Displays a status badge for application tracking. */
  const meta = STATUS_META[status] || { label: status || "Unknown", color: "info" };
  return (
    <span className="badge" title={`Status: ${meta.label}`}>
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: 99,
          background:
            meta.color === "success" ? "var(--teal-600)" : meta.color === "error" ? "var(--red-500)" : "var(--violet-600)",
          display: "inline-block",
        }}
      />
      {meta.label}
    </span>
  );
}
