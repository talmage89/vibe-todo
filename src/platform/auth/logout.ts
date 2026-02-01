import type { Elysia, Handler } from "elysia";
import { createExpiredSessionCookie, deleteSession, getSessionFromContext } from "./session";

/**
 * Registers the logout route
 */
export const registerLogout = (app: Elysia) => {
  app.post("/auth/logout", getLogoutHandler());
  return app;
};

/**
 * Handler for logging out the current user
 */
const getLogoutHandler = (): Handler => {
  return async (context) => {
    const { cookie, set } = context;

    // Get the current session
    const session = await getSessionFromContext(context);

    if (session) {
      // Delete the session from the database
      const sessionToken = cookie.session?.value;
      if (typeof sessionToken === "string") {
        await deleteSession(sessionToken);
      }
    }

    // Clear the session cookie
    const expiredCookie = createExpiredSessionCookie();
    cookie.session?.set(expiredCookie);

    set.status = 200;
    return { success: true };
  };
};
