import { randomBytes } from "node:crypto";
import type { ElysiaCookie } from "elysia/cookies";
import { db } from "~/platform/db";
import { Time, toSeconds } from "~/platform/utils/time";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = Time.ONE_MONTH;

/**
 * Creates a new database-backed session and returns the cookie configuration.
 */
export const createSession = async (
  userId: string,
  options?: { userAgent?: string; ipAddress?: string },
): Promise<ElysiaCookie> => {
  const token = generateSessionToken();
  const maxAgeSeconds = toSeconds(SESSION_MAX_AGE);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent: options?.userAgent,
      ipAddress: options?.ipAddress,
    },
  });

  return {
    value: token,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV !== "development",
    maxAge: maxAgeSeconds,
  };
};

/**
 * Validates a session token and returns the userId if valid.
 * Returns null if the session is invalid or expired.
 */
export const validateSession = async (token: string | undefined): Promise<string | null> => {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return session.userId;
};

/**
 * Deletes a session by token (logout).
 */
export const deleteSession = async (token: string | undefined): Promise<void> => {
  if (!token) return;
  await db.session.delete({ where: { token } }).catch(() => {});
};

/**
 * Deletes all sessions for a user (logout from all devices).
 */
export const deleteAllUserSessions = async (userId: string): Promise<void> => {
  await db.session.deleteMany({ where: { userId } });
};

/**
 * Creates a cookie configuration that clears the session.
 */
export const clearSessionCookie = (): ElysiaCookie => {
  return {
    value: "",
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 0,
  };
};

/**
 * Generates a cryptographically secure session token.
 */
const generateSessionToken = (): string => {
  return randomBytes(32).toString("base64url");
};

export { SESSION_COOKIE_NAME };
