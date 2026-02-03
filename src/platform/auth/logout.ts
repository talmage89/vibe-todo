import type { Elysia } from "elysia";
import { clearSessionCookie, deleteSession, SESSION_COOKIE_NAME } from "./session";

/**
 * Registers the logout endpoint.
 * POST /auth/logout - Deletes the session from database and clears the cookie.
 */
export const registerLogout = (app: Elysia) => {
  app.post("/auth/logout", async ({ cookie }) => {
    const sessionToken = cookie[SESSION_COOKIE_NAME]?.value as string | undefined;
    await deleteSession(sessionToken);
    cookie[SESSION_COOKIE_NAME]?.set(clearSessionCookie());
    return { success: true };
  });

  return app;
};
