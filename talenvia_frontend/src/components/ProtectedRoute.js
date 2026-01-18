import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppState } from "../state/AppState";

/**
 * ProtectedRoute
 * Wraps routes that require an authenticated Supabase user.
 * If unauthenticated, redirects to /signin and includes the intended destination
 * as `?redirect=/path` so the auth pages can redirect back after success.
 */

// PUBLIC_INTERFACE
export default function ProtectedRoute({ children }) {
  /** Protects child routes from unauthenticated access. */
  const { authUser } = useAppState();
  const location = useLocation();

  if (!authUser) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  return children;
}
