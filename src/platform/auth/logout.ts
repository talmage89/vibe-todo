import type { Elysia } from "elysia";
import { clearSessionCookie, deleteSession, SESSION_COOKIE_NAME } from "./session";

export const registerLogout = (app: Elysia) => {
  app.post("/auth/logout", async ({ cookie }) => {
    const sessionToken = cookie[SESSION_COOKIE_NAME]?.value as string | undefined;
    await deleteSession(sessionToken);
    cookie[SESSION_COOKIE_NAME]?.set(clearSessionCookie());
    return { success: true };
  });

  return app;
};
