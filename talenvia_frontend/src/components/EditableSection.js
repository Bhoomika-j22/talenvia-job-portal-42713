import React, { useState } from "react";

/**
 * EditableSection
 * - Reusable "view vs edit" wrapper for sections of a page.
 * - Adapted from the user-provided component to match Talenvia's existing CSS (no Tailwind),
 *   and to avoid adding new dependencies (lucide-react).
 */

// PUBLIC_INTERFACE
export default function EditableSection({ title, viewContent, editContent, onSave, onCancel }) {
  /** Renders a section with inline Edit / Save / Cancel controls and view/edit content areas. */
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="card full">
      {/* HEADER */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0 }}>{title}</h4>

        {!isEditing ? (
          <button
            className="btn"
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${title}`}
            title={`Edit ${title}`}
          >
            Edit
          </button>
        ) : null}
      </div>

      {/* VIEW MODE */}
      {!isEditing ? <div style={{ marginTop: 10 }}>{viewContent}</div> : null}

      {/* EDIT MODE */}
      {isEditing ? (
        <div style={{ marginTop: 10 }}>
          {editContent}

          <div className="row" style={{ gap: 10, marginTop: 12, justifyContent: "flex-end" }}>
            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                onSave?.();
                setIsEditing(false);
              }}
            >
              Save
            </button>

            <button
              className="btn"
              type="button"
              onClick={() => {
                onCancel?.();
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
