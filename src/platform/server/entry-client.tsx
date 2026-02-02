import { createBrowserHistory, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "~/app";
import { routeTree } from "~/platform/router/router";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const router = createRouter({
  routeTree,
  history: createBrowserHistory(),
});

void router.load();

hydrateRoot(
  container,
  <StrictMode>
    <App router={router} />
  </StrictMode>,
);
