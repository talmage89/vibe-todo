import type { Elysia } from "elysia";
import { clearSessionCookie } from "./session";

/**
 * Registers the logout endpoint.
 * POST /auth/logout - Clears the session cookie and returns success.
 */
export const registerLogout = (app: Elysia) => {
  app.post("/auth/logout", ({ cookie }) => {
    cookie.session?.set(clearSessionCookie());
    return { success: true };
  });

  return app;
};
