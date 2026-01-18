import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { demoInsertUserRow } from "./utils/supabaseHelpers";

// Opt-in demo hook (no-op unless manually invoked in devtools).
// This intentionally avoids changing routes/UI while still providing an easy usage pathway.
if (typeof window !== "undefined") {
  window.__talenviaDemoInsertUserRow = demoInsertUserRow;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
