import type { Elysia } from "elysia";
import { db } from "~/platform/db";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

/**
 * Elysia plugin that adds auth middleware to protect routes.
 * Verifies session cookie and attaches userId to request context.
 */
export const authMiddleware = (app: Elysia) => {
  return app.derive(async ({ cookie, set }) => {
    const sessionCookie = cookie.session;

    if (!sessionCookie?.value || typeof sessionCookie.value !== "string") {
      set.status = 401;
      return {
        user: null,
        error: "Unauthorized: No session cookie",
      };
    }

    const userId = sessionCookie.value as string;

    // Verify user exists in database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      set.status = 401;
      return {
        user: null,
        error: "Unauthorized: Invalid session",
      };
    }

    return {
      user,
      error: null,
    };
  });
};

/**
 * Type guard for authenticated requests.
 * Use this in route handlers to ensure user is authenticated.
 */
export const requireAuth = (context: { user: AuthUser | null; error: string | null }) => {
  if (!context.user) {
    throw new Error(context.error || "Unauthorized");
  }
  return context.user;
};
