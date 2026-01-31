import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "~/app";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

hydrateRoot(
  container,
  <StrictMode>
    <App />
  </StrictMode>,
);
