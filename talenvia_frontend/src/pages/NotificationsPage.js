import React, { useMemo } from "react";
import { useAppState } from "../state/AppState";

// PUBLIC_INTERFACE
export default function NotificationsPage() {
  /** Notifications page listing updates and reminders. */
  const { state, actions } = useAppState();

  const unreadCount = useMemo(() => state.notifications.filter((n) => !n.read).length, [state.notifications]);

  return (
    <section className="page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            Stay on top of reminders—practice, follow-ups, and progress updates.
          </p>
        </div>
        <span className="badge">{unreadCount} unread</span>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        {state.notifications.map((n) => (
          <div key={n.id} className="card full">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h4 style={{ margin: 0 }}>{n.title}</h4>
              <span className="pill" style={{ background: n.read ? "rgba(107,114,128,0.8)" : "rgba(124,58,237,0.92)" }}>
                {n.read ? "Read" : "Unread"}
              </span>
            </div>
            <p style={{ marginTop: 10, color: "var(--muted)" }}>{n.body}</p>
            <p style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>
              {new Date(n.ts).toLocaleString()}
            </p>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
              {!n.read ? (
                <button className="btn teal" onClick={() => actions.markNotificationRead(n.id)} type="button">
                  Mark as read
                </button>
              ) : null}
            </div>
          </div>
        ))}

        {state.notifications.length === 0 ? (
          <div className="card full">
            <h4>No notifications yet</h4>
            <p>When you complete mock tests or add applications, Talenvia will show updates here.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
