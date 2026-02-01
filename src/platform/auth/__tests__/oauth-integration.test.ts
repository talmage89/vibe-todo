import { describe, expect, mock, test } from "bun:test";
import { Elysia } from "elysia";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifySignedJson } from "../crypto";
import { getSessionUserId } from "../session";

mock.module("/Users/talmage/code/vibe/todo/todo/src/platform/auth/user.ts", () => {
  return {
    upsertAccount: async () => ({ id: "account_1", userId: "user_1" }),
  };
});

const setBaseEnv = () => {
  process.env.PORT = "3000";
  process.env.DB_URL = "postgres://user:pass@localhost:5432/db";
  process.env.SESSION_SECRET = "s".repeat(64);

  // The env() schema currently requires both providers to be configured.
  process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "gh_client";
  process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "gh_secret";
  process.env.GITHUB_REDIRECT_URI =
    process.env.GITHUB_REDIRECT_URI ?? "http://example.com/auth/github/callback";

  process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "google_client";
  process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "google_secret";
  process.env.GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ?? "http://example.com/auth/google/callback";
};

const parseSetCookie = (setCookieHeaders: string[]) => {
  const cookies: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const [pair] = header.split(";", 1);
    if (!pair) continue;
    const [name, ...rest] = pair.split("=");
    if (!name) continue;
    cookies[name] = rest.join("=");
  }
  return cookies;
};

const getSetCookie = (res: Response) => res.headers.getSetCookie?.() ?? [];

describe("OAuth integration", () => {
  test("GitHub happy path sets signed session cookie", async () => {
    setBaseEnv();

    const fetchOrig = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url === "https://github.com/login/oauth/access_token") {
        return new Response(
          JSON.stringify({
            access_token: "gho_token",
            token_type: "bearer",
            scope: "read:user,user:email",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url === "https://api.github.com/user") {
        return new Response(
          JSON.stringify({
            id: 123,
            login: "octocat",
            email: null,
            name: "Octo Cat",
            avatar_url: "https://avatars.example/octo.png",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url === "https://api.github.com/user/emails") {
        return new Response(
          JSON.stringify([
            { email: "octo@example.com", primary: true, verified: true, visibility: null },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return fetchOrig(input, init);
    }) as typeof globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      const { registerGithubOAuth } = await import("../github");
      const app = new Elysia();
      registerGithubOAuth(app);

      const startRes = await app.handle(new Request("http://example.com/auth/github"));
      expect(startRes.status).toBeGreaterThanOrEqual(300);
      const startCookies = parseSetCookie(getSetCookie(startRes));
      expect(startCookies.oauth_github).toBeTruthy();

      const location = startRes.headers.get("location");
      expect(location).toBeTruthy();
      const state = new URL(location as string).searchParams.get("state");
      expect(state).toBeTruthy();

      const cbRes = await app.handle(
        new Request(
          `http://example.com/auth/github/callback?code=CODE&state=${encodeURIComponent(state as string)}`,
          {
            headers: { Cookie: `oauth_github=${startCookies.oauth_github}` },
          },
        ),
      );
      expect(cbRes.status).toBeGreaterThanOrEqual(300);
      expect(cbRes.headers.get("location")).toBe("/");

      const cbCookies = parseSetCookie(getSetCookie(cbRes));
      expect(cbCookies.session).toBeTruthy();
      expect(getSessionUserId(cbCookies.session)).toBeTruthy();
    } finally {
      globalThis.fetch = fetchOrig;
    }
  });

  test("GitHub state mismatch is rejected", async () => {
    setBaseEnv();

    const { registerGithubOAuth } = await import("../github");
    const app = new Elysia();
    registerGithubOAuth(app);

    const startRes = await app.handle(new Request("http://example.com/auth/github"));
    const startCookies = parseSetCookie(getSetCookie(startRes));
    const location = startRes.headers.get("location");
    expect(location).toBeTruthy();
    const goodState = new URL(location as string).searchParams.get("state");
    expect(goodState).toBeTruthy();

    const cbRes = await app.handle(
      new Request(`http://example.com/auth/github/callback?code=CODE&state=wrong`, {
        headers: { Cookie: `oauth_github=${startCookies.oauth_github}` },
      }),
    );
    expect(cbRes.status).toBe(400);

    // sanity: goodState differs from "wrong"
    expect(goodState).not.toBe("wrong");
  });

  test("Google happy path validates id_token and sets signed session cookie", async () => {
    setBaseEnv();

    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    const jwkWithKid = { ...jwk, kid: "test-kid", use: "sig", alg: "RS256" };

    const fetchOrig = globalThis.fetch;
    const { registerGoogleOAuth } = await import("../google");
    const app = new Elysia();
    registerGoogleOAuth(app);

    const startRes = await app.handle(new Request("http://example.com/auth/google"));
    const startCookies = parseSetCookie(getSetCookie(startRes));
    expect(startCookies.oauth_google).toBeTruthy();

    // Extract nonce from signed cookie
    const oauthPayload = verifySignedJson(
      startCookies.oauth_google,
      process.env.SESSION_SECRET ?? "",
      (p): p is { state: string; codeVerifier: string; nonce: string } => {
        if (!p || typeof p !== "object") return false;
        const obj = p as Record<string, unknown>;
        return (
          typeof obj.state === "string" &&
          typeof obj.codeVerifier === "string" &&
          typeof obj.nonce === "string"
        );
      },
    );
    expect(oauthPayload).toBeTruthy();
    if (!oauthPayload) throw new Error("Missing oauth payload");
    const nonce = oauthPayload.nonce;

    const idToken = await new SignJWT({
      sub: "google-subject",
      email: "g@example.com",
      email_verified: true,
      name: "G User",
      picture: "https://pics.example/g.png",
      nonce,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuer("https://accounts.google.com")
      .setAudience("google_client")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const location = startRes.headers.get("location");
    expect(location).toBeTruthy();
    const state = new URL(location as string).searchParams.get("state");
    expect(state).toBeTruthy();

    try {
      const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url === "https://www.googleapis.com/oauth2/v3/certs") {
          return new Response(JSON.stringify({ keys: [jwkWithKid] }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
        if (url === "https://oauth2.googleapis.com/token") {
          return new Response(
            JSON.stringify({
              access_token: "google_access",
              expires_in: 3600,
              scope: "openid email profile",
              token_type: "Bearer",
              id_token: idToken,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (url === "https://openidconnect.googleapis.com/v1/userinfo") {
          return new Response(
            JSON.stringify({
              sub: "google-subject",
              email: "g@example.com",
              email_verified: true,
              name: "G User",
              picture: "https://pics.example/g.png",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return fetchOrig(input, init);
      }) as typeof globalThis.fetch;
      globalThis.fetch = mockFetch;

      const cbRes = await app.handle(
        new Request(
          `http://example.com/auth/google/callback?code=CODE&state=${encodeURIComponent(state as string)}`,
          {
            headers: { Cookie: `oauth_google=${startCookies.oauth_google}` },
          },
        ),
      );
      expect(cbRes.status).toBeGreaterThanOrEqual(300);
      expect(cbRes.headers.get("location")).toBe("/");

      const cbCookies = parseSetCookie(getSetCookie(cbRes));
      expect(getSessionUserId(cbCookies.session)).toBeTruthy();
    } finally {
      globalThis.fetch = fetchOrig;
    }
  });

  test("Google rejects invalid nonce in id_token", async () => {
    setBaseEnv();

    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    const jwkWithKid = { ...jwk, kid: "test-kid", use: "sig", alg: "RS256" };

    const { registerGoogleOAuth } = await import("../google");
    const app = new Elysia();
    registerGoogleOAuth(app);

    const startRes = await app.handle(new Request("http://example.com/auth/google"));
    const startCookies = parseSetCookie(getSetCookie(startRes));
    const location = startRes.headers.get("location");
    expect(location).toBeTruthy();
    const state = new URL(location as string).searchParams.get("state");
    expect(state).toBeTruthy();

    const idToken = await new SignJWT({
      sub: "google-subject",
      email: "g@example.com",
      email_verified: true,
      nonce: "WRONG_NONCE",
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuer("https://accounts.google.com")
      .setAudience("google_client")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const fetchOrig = globalThis.fetch;
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url === "https://www.googleapis.com/oauth2/v3/certs") {
        return new Response(JSON.stringify({ keys: [jwkWithKid] }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
        });
      }
      if (url === "https://oauth2.googleapis.com/token") {
        return new Response(
          JSON.stringify({
            access_token: "google_access",
            expires_in: 3600,
            scope: "openid email profile",
            token_type: "Bearer",
            id_token: idToken,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url === "https://openidconnect.googleapis.com/v1/userinfo") {
        return new Response(
          JSON.stringify({
            sub: "google-subject",
            email: "g@example.com",
            email_verified: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return fetchOrig(input, init);
    }) as typeof globalThis.fetch;
    globalThis.fetch = mockFetch;

    const consoleErrorOrig = console.error;
    try {
      // This path is expected to fail; silence noisy stack output.
      console.error = () => {};
      const cbRes = await app.handle(
        new Request(
          `http://example.com/auth/google/callback?code=CODE&state=${encodeURIComponent(state as string)}`,
          {
            headers: { Cookie: `oauth_google=${startCookies.oauth_google}` },
          },
        ),
      );
      // Handler currently returns 500 for internal errors; invalid nonce should land here.
      expect(cbRes.status).toBe(500);
    } finally {
      console.error = consoleErrorOrig;
      globalThis.fetch = fetchOrig;
    }
  });
});
