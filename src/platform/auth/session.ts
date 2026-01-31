import type { ElysiaCookie } from "elysia/cookies";
import { Time, toSeconds } from "~/platform/utils/time";

export const createSessionCookie = (userId: string): ElysiaCookie => {
  const secure = process.env.NODE_ENV !== "development";
  const maxAge = toSeconds(Time.ONE_MONTH);

  return {
    value: userId,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure,
    maxAge,
  };
};
