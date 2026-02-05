import { Elysia } from "elysia";
import { db } from "../db";
import type { Prisma } from "../db/generated";
import { AuthenticationError } from "./errors";
import { SESSION_COOKIE_NAME, validateSession } from "./session";

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  createdAt: true,
  theme: true,
  defaultView: true,
  defaultProjectId: true,
};

export type AuthUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export interface AuthContext extends Record<string, unknown> {
  user?: AuthUser;
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
      select: userSelect,
    });

    return { user: user ?? undefined };
  },
);

export const requireAuth = (user: AuthUser | undefined): AuthUser => {
  if (!user) {
    throw new AuthenticationError("Unauthorized: Authentication required");
  }
  return user;
};
