import { Elysia } from "elysia";
import { db } from "../db";
import type { User } from "../db/generated";
import { AuthenticationError } from "./errors";
import { SESSION_COOKIE_NAME, validateSession } from "./session";

export interface AuthContext extends Record<string, unknown> {
  user?: User;
}

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

export const requireAuth = (user: User | undefined): User => {
  if (!user) {
    throw new AuthenticationError("Unauthorized: Authentication required");
  }
  return user;
};
