import { type Elysia, type Handler, redirect } from "elysia";
import { env } from "~/platform/utils/env";
import { AccountProvider } from "../db/generated";
import { getGoogleConfig, type OAuthProvider } from "./config";
import { signJson, verifySignedJson } from "./crypto";
import { verifyGoogleIdToken } from "./google-oidc";
import { fetchJsonOrThrow } from "./http";
import { parseOAuthCallbackQuery } from "./oauth-callback";
import { clearOAuthEphemeralCookie, createOAuthEphemeralCookie } from "./oauth-cookie";
import { createOAuthStateAndPkce } from "./oauth-flow";
import { createSession, SESSION_COOKIE_NAME } from "./session";
import { type UpsertAccountData, type UpsertUserData, upsertAccount } from "./user";

interface GoogleUserInfo {
  email: string;
  email_verified: boolean;
  sub: string;
  name?: string;
  picture?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

const googleOAuthCookieName = "oauth_google";
const googleOAuthCookiePath = "/auth/google/callback";
const googleOAuthCookieMaxAgeSeconds = 10 * 60;

export const registerGoogleOAuth = (app: Elysia) => {
  const config = getGoogleConfig();
  app.get("/auth/google", getGoogleOAuthRedirectHandler(config));
  app.get("/auth/google/callback", getGoogleOAuthCallbackHandler(config));
  return app;
};

const getGoogleOAuthRedirectHandler = (config: OAuthProvider): Handler => {
  return ({ cookie }) => {
    const { SESSION_SECRET } = env();
    const { state, codeVerifier, codeChallenge, nonce } = createOAuthStateAndPkce({
      includeNonce: true,
    });
    if (!nonce) {
      throw new Error("Missing nonce");
    }

    cookie[googleOAuthCookieName]?.set(
      createOAuthEphemeralCookie({
        value: signJson({ state, codeVerifier, nonce }, SESSION_SECRET),
        maxAgeSeconds: googleOAuthCookieMaxAgeSeconds,
        path: googleOAuthCookiePath,
      }),
    );

    const url = buildGoogleOAuthUrl(config, { state, codeChallenge, nonce });
    return redirect(url);
  };
};

const buildGoogleOAuthUrl = (
  config: OAuthProvider,
  oauth: { state: string; codeChallenge: string; nonce: string },
) => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline",
    prompt: "select_account",
    include_granted_scopes: "true",
    state: oauth.state,
    code_challenge: oauth.codeChallenge,
    code_challenge_method: "S256",
    nonce: oauth.nonce,
  });

  const url = new URL(config.authorizationUrl);
  url.search = params.toString();

  return url.toString();
};

const getGoogleOAuthCallbackHandler = (config: OAuthProvider): Handler => {
  return async ({ query, cookie, set, request }) => {
    const parsed = parseOAuthCallbackQuery(query);
    if (!parsed.ok) {
      set.status = parsed.status;
      return parsed.body;
    }

    try {
      const { SESSION_SECRET } = env();
      const signedCookieValue = cookie[googleOAuthCookieName]?.value as string | undefined;
      const cookieData = verifySignedJson(
        signedCookieValue,
        SESSION_SECRET,
        isGoogleOAuthCookiePayload,
      );

      if (!cookieData) {
        set.status = 400;
        return { error: "Authorization failed", details: "Missing OAuth state" };
      }

      if (cookieData.state !== parsed.state) {
        set.status = 400;
        return { error: "Authorization failed", details: "Invalid OAuth state" };
      }

      cookie[googleOAuthCookieName]?.set(
        clearOAuthEphemeralCookie({ path: googleOAuthCookiePath }),
      );

      const userId = await authenticateGoogleOAuth(
        config,
        parsed.code,
        cookieData.codeVerifier,
        cookieData.nonce,
      );

      const userAgent = request.headers.get("user-agent") ?? undefined;
      const sessionCookie = await createSession(userId, { userAgent });
      cookie[SESSION_COOKIE_NAME]?.set(sessionCookie);
      return redirect("/");
    } catch (err) {
      console.error("OAuth error:", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  };
};

type GoogleOAuthData = {
  tokens: GoogleTokenResponse;
  userInfo: GoogleUserInfo;
};

const authenticateGoogleOAuth = async (
  config: OAuthProvider,
  code: string,
  codeVerifier: string,
  nonce: string,
): Promise<string> => {
  const { tokens, userInfo } = await getGoogleOAuthData(config, code, codeVerifier, nonce);

  const accountData: UpsertAccountData = {
    provider: AccountProvider.GOOGLE,
    providerId: userInfo.sub,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  };

  const userData: UpsertUserData = {
    email: userInfo.email,
    name: userInfo.name,
    avatar: userInfo.picture,
  };

  const { userId } = await upsertAccount(accountData, userData);
  return userId;
};

const getGoogleOAuthData = async (
  config: OAuthProvider,
  code: string,
  codeVerifier: string,
  nonce: string,
): Promise<GoogleOAuthData> => {
  const tokens = await fetchGoogleToken(config, code, codeVerifier);
  if (!tokens.id_token) {
    throw new Error("Missing Google id_token");
  }

  const idTokenClaims = await verifyGoogleIdToken({
    idToken: tokens.id_token,
    clientId: config.clientId,
    expectedNonce: nonce,
  });

  if (idTokenClaims.email_verified !== true) {
    throw new Error("Google account email is not verified");
  }

  if (!idTokenClaims.email) {
    throw new Error("Google ID token missing email");
  }

  let userInfo: GoogleUserInfo = {
    sub: idTokenClaims.sub,
    email: idTokenClaims.email,
    email_verified: true,
    name: idTokenClaims.name,
    picture: idTokenClaims.picture,
  };

  if (!userInfo.name || !userInfo.picture) {
    const enriched = await fetchGoogleUserInfo(config.userInfoUrl, tokens.access_token);
    if (enriched.sub !== userInfo.sub) {
      throw new Error("Google userinfo subject mismatch");
    }
    if (enriched.email !== userInfo.email) {
      throw new Error("Google userinfo email mismatch");
    }
    if (!enriched.email_verified) {
      throw new Error("Google account email is not verified");
    }
    userInfo = {
      ...userInfo,
      name: userInfo.name ?? enriched.name,
      picture: userInfo.picture ?? enriched.picture,
    };
  }

  if (!userInfo.email_verified) {
    throw new Error("Google account email is not verified");
  }
  return { tokens, userInfo };
};

const fetchGoogleToken = async (
  config: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<GoogleTokenResponse> => {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });

  return await fetchJsonOrThrow<GoogleTokenResponse>(
    config.tokenUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    },
    "Failed to exchange code for tokens",
  );
};

const fetchGoogleUserInfo = async (userInfoUrl: string, token: string): Promise<GoogleUserInfo> => {
  return await fetchJsonOrThrow<GoogleUserInfo>(
    userInfoUrl,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "todo",
      },
    },
    "Failed to fetch user info",
  );
};

type GoogleOAuthCookiePayload = {
  state: string;
  codeVerifier: string;
  nonce: string;
};

const isGoogleOAuthCookiePayload = (value: unknown): value is GoogleOAuthCookiePayload => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<GoogleOAuthCookiePayload>;
  return (
    typeof v.state === "string" && typeof v.codeVerifier === "string" && typeof v.nonce === "string"
  );
};
