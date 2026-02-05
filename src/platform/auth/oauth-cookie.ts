import type { ElysiaCookie } from "elysia/cookies";

export const createOAuthEphemeralCookie = (options: {
  value: string;
  maxAgeSeconds: number;
  path: string;
}) => {
  const secure = process.env.NODE_ENV !== "development";

  return {
    value: options.value,
    httpOnly: true,
    sameSite: "lax",
    path: options.path,
    secure,
    maxAge: options.maxAgeSeconds,
  } satisfies ElysiaCookie;
};

export const clearOAuthEphemeralCookie = (options: { path: string }) =>
  createOAuthEphemeralCookie({ value: "", maxAgeSeconds: 0, path: options.path });
