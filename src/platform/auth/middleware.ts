import { Elysia } from "elysia";
import { db } from "../db";
import type { User } from "../db/generated";
import { AuthenticationError } from "./errors";
import { SESSION_COOKIE_NAME, validateSession } from "./session";

/**
 * Extended context type with optional user from auth middleware.
 */
export interface AuthContext extends Record<string, unknown> {
  user?: User;
}

/**
 * Auth middleware plugin that validates session cookies and attaches user to context.
 * Does not block requests - use requireAuth() in handlers to enforce authentication.
 */
export const authMiddleware = new Elysia({ name: "auth-middleware" }).derive(
  { as: "global" },
  async ({ cookie }) => {
    const sessionToken = cookie[SESSION_COOKIE_NAME]?.value as string | undefined;
    const userId = await validateSession(sessionToken);

    if (!userId) {
      return { user: undefined };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    return { user: user ?? undefined };
  },
);

/**
 * Type guard and helper to enforce authentication in route handlers.
 * Throws an error if user is not authenticated.
 *
 * @example
 * ```ts
 * app.get('/api/me', ({ user }) => {
 *   const authenticatedUser = requireAuth(user);
 *   return { user: authenticatedUser };
 * });
 * ```
 */
export const requireAuth = (user: User | undefined): User => {
  if (!user) {
    throw new AuthenticationError("Unauthorized: Authentication required");
  }
  return user;
};
