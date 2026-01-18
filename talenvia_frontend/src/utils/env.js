/**
 * Talenvia env helper utilities.
 * CRA injects env vars prefixed with REACT_APP_ at build time.
 */

// PUBLIC_INTERFACE
export function getEnv() {
  /** Returns a normalized env config object used across the app. */
  const featureFlagsRaw = process.env.REACT_APP_FEATURE_FLAGS || "";
  const experimentsEnabledRaw = process.env.REACT_APP_EXPERIMENTS_ENABLED || "false";

  return {
    apiBase: process.env.REACT_APP_API_BASE || "",
    backendUrl: process.env.REACT_APP_BACKEND_URL || "",
    frontendUrl: process.env.REACT_APP_FRONTEND_URL || "",
    wsUrl: process.env.REACT_APP_WS_URL || "",
    nodeEnv: process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || "development",
    telemetryDisabled: process.env.REACT_APP_NEXT_TELEMETRY_DISABLED || "",
    enableSourceMaps: process.env.REACT_APP_ENABLE_SOURCE_MAPS || "",
    port: process.env.REACT_APP_PORT || "",
    trustProxy: process.env.REACT_APP_TRUST_PROXY || "",
    logLevel: process.env.REACT_APP_LOG_LEVEL || "info",
    healthcheckPath: process.env.REACT_APP_HEALTHCHECK_PATH || "/health",
    featureFlags: featureFlagsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    experimentsEnabled: String(experimentsEnabledRaw).toLowerCase() === "true",
  };
}
