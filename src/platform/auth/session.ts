import { randomBytes } from "node:crypto";
import type { ElysiaCookie } from "elysia/cookies";
import { db } from "~/platform/db";
import { Time, toSeconds } from "~/platform/utils/time";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = Time.ONE_MONTH;

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

export const validateSession = async (token: string | undefined): Promise<string | null> => {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return session.userId;
};

export const deleteSession = async (token: string | undefined): Promise<void> => {
  if (!token) return;
  await db.session.delete({ where: { token } }).catch(() => {});
};

export const deleteAllUserSessions = async (userId: string): Promise<void> => {
  await db.session.deleteMany({ where: { userId } });
};

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

const generateSessionToken = (): string => {
  return randomBytes(32).toString("base64url");
};

export { SESSION_COOKIE_NAME };
