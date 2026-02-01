import type { Context } from "elysia";
import type { ElysiaCookie } from "elysia/cookies";
import { db } from "~/platform/db";
import { env } from "~/platform/utils/env";
import { Time, toSeconds } from "~/platform/utils/time";

const COOKIE_NAME = "session";
const SESSION_MAX_AGE = Time.ONE_MONTH;

interface SessionData {
  id: string;
  userId: string;
  expiresAt: Date;
}

interface CreateSessionOptions {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Creates a new session for the user and returns a signed cookie
 */
export const createSession = async (
  userId: string,
  options: CreateSessionOptions = {},
): Promise<ElysiaCookie> => {
  // Generate a cryptographically secure random token
  const token = await generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

  // Store session in database
  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
    },
  });

  return createSessionCookie(token);
};

/**
 * Validates a session token and returns the session data if valid
 */
export const validateSession = async (token: string): Promise<SessionData | null> => {
  const session = await db.session.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
};

/**
 * Extracts and validates the session from the request context
 */
export const getSessionFromContext = async (context: Context): Promise<SessionData | null> => {
  const cookieValue = context.cookie[COOKIE_NAME]?.value;
  if (typeof cookieValue !== "string") {
    return null;
  }

  return await validateSession(cookieValue);
};

/**
 * Invalidates a session by token
 */
export const deleteSession = async (token: string): Promise<void> => {
  await db.session.deleteMany({ where: { token } });
};

/**
 * Invalidates all sessions for a user
 */
export const deleteAllUserSessions = async (userId: string): Promise<void> => {
  await db.session.deleteMany({ where: { userId } });
};

/**
 * Cleans up expired sessions from the database
 * This should be run periodically (e.g., via a cron job)
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  const result = await db.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
};

/**
 * Creates a session cookie with the given token
 */
const createSessionCookie = (token: string): ElysiaCookie => {
  const secure = process.env.NODE_ENV !== "development";
  const maxAge = toSeconds(SESSION_MAX_AGE);

  return {
    value: token,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure,
    maxAge,
  };
};

/**
 * Creates an expired session cookie for logout
 */
export const createExpiredSessionCookie = (): ElysiaCookie => {
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
 * Generates a cryptographically secure random session token
 */
const generateSessionToken = async (): Promise<string> => {
  const { SESSION_SECRET } = env();

  // Generate 32 random bytes
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));

  // Convert to base64url (URL-safe base64)
  const base64 = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Add a timestamp and HMAC signature for additional security
  const timestamp = Date.now().toString(36);
  const payload = `${base64}.${timestamp}`;

  // Create HMAC signature using SESSION_SECRET
  const signature = await createHmacSignature(payload, SESSION_SECRET);

  return `${payload}.${signature}`;
};

/**
 * Creates an HMAC signature for the given data
 */
const createHmacSignature = async (data: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  // Import the secret as a CryptoKey
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // Sign the data
  const signature = await crypto.subtle.sign("HMAC", key, messageData);

  // Convert to base64url
  const signatureArray = new Uint8Array(signature);
  return btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};
