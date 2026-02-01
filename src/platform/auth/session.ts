import type { ElysiaCookie } from "elysia/cookies";
import { env } from "~/platform/utils/env";
import { Time, toSeconds } from "~/platform/utils/time";
import { signJson, verifySignedJson } from "./crypto";
import { createNonce } from "./oauth-flow";

export const createSessionCookie = (userId: string): ElysiaCookie => {
  const secure = process.env.NODE_ENV !== "development";
  const maxAge = toSeconds(Time.ONE_MONTH);
  const { SESSION_SECRET } = env();

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + maxAge;
  const sessionNonce = createNonce();

  return {
    value: signSessionPayload(
      { userId, iat: issuedAt, exp: expiresAt, n: sessionNonce },
      SESSION_SECRET,
    ),
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure,
    maxAge,
  };
};

type SessionPayload = {
  userId: string;
  iat: number;
  exp: number;
  n: string;
};

export const getSessionUserId = (value: string | undefined): string | null => {
  if (!value) return null;
  const { SESSION_SECRET } = env();
  const payload = verifySignedJson(value, SESSION_SECRET, isSessionPayload);
  if (!payload) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload.userId;
};

const signSessionPayload = (payload: SessionPayload, secret: string) => {
  return signJson(payload, secret);
};

const isSessionPayload = (value: unknown): value is SessionPayload => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SessionPayload>;
  return (
    typeof v.userId === "string" &&
    typeof v.iat === "number" &&
    typeof v.exp === "number" &&
    typeof v.n === "string"
  );
};
