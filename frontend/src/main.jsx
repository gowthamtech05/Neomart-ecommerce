import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
if (import.meta.env.PROD) {
  const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "");
  if (base) {
    fetch(`${base}/health`).catch(() => {});
    setInterval(() => fetch(`${base}/health`).catch(() => {}), 8 * 60 * 1000);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
