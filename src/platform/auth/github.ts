import { type Elysia, type Handler, redirect } from "elysia";
import { AccountProvider } from "~/platform/db/generated";
import { env } from "~/platform/utils/env";
import { getGithubConfig, type OAuthProvider } from "./config";
import { signJson, verifySignedJson } from "./crypto";
import { fetchJsonOrThrow } from "./http";
import { parseOAuthCallbackQuery } from "./oauth-callback";
import { clearOAuthEphemeralCookie, createOAuthEphemeralCookie } from "./oauth-cookie";
import { createOAuthStateAndPkce } from "./oauth-flow";
import { createSession, SESSION_COOKIE_NAME } from "./session";
import { type UpsertAccountData, type UpsertUserData, upsertAccount } from "./user";

interface GithubUserInfo {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

interface GithubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

const githubOAuthCookieName = "oauth_github";
const githubOAuthCookiePath = "/auth/github/callback";
const githubOAuthCookieMaxAgeSeconds = 10 * 60;
const githubApiVersion = "2022-11-28";

export const registerGithubOAuth = (app: Elysia) => {
  const config = getGithubConfig();
  app.get("/auth/github", getGithubOAuthRedirectHandler(config));
  app.get("/auth/github/callback", getGithubOAuthCallbackHandler(config));
  return app;
};

const getGithubOAuthRedirectHandler = (config: OAuthProvider): Handler => {
  return ({ cookie }) => {
    const { SESSION_SECRET } = env();
    const { state, codeVerifier, codeChallenge } = createOAuthStateAndPkce();

    cookie[githubOAuthCookieName]?.set(
      createOAuthEphemeralCookie({
        value: signJson({ state, codeVerifier }, SESSION_SECRET),
        maxAgeSeconds: githubOAuthCookieMaxAgeSeconds,
        path: githubOAuthCookiePath,
      }),
    );

    const url = buildGithubOAuthUrl(config, { state, codeChallenge });
    return redirect(url);
  };
};

const buildGithubOAuthUrl = (
  config: OAuthProvider,
  oauth: { state: string; codeChallenge: string },
) => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    state: oauth.state,
    code_challenge: oauth.codeChallenge,
    code_challenge_method: "S256",
  });

  const url = new URL(config.authorizationUrl);
  url.search = params.toString();

  return url.toString();
};

const getGithubOAuthCallbackHandler = (config: OAuthProvider): Handler => {
  return async ({ query, cookie, set, request }) => {
    const parsed = parseOAuthCallbackQuery(query);
    if (!parsed.ok) {
      set.status = parsed.status;
      return parsed.body;
    }

    try {
      const { SESSION_SECRET } = env();
      const signedCookieValue = cookie[githubOAuthCookieName]?.value as string | undefined;
      const cookieData = verifySignedJson(
        signedCookieValue,
        SESSION_SECRET,
        isGithubOAuthCookiePayload,
      );

      if (!cookieData) {
        set.status = 400;
        return { error: "Authorization failed", details: "Missing OAuth state" };
      }

      if (cookieData.state !== parsed.state) {
        set.status = 400;
        return { error: "Authorization failed", details: "Invalid OAuth state" };
      }

      cookie[githubOAuthCookieName]?.set(
        clearOAuthEphemeralCookie({ path: githubOAuthCookiePath }),
      );

      const userId = await authenticateGithubOAuth(config, parsed.code, cookieData.codeVerifier);

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

type GithubOAuthData = {
  tokens: GithubTokenResponse;
  userInfo: GithubUserInfo;
  email: string;
};

const authenticateGithubOAuth = async (
  config: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<string> => {
  const { tokens, userInfo, email } = await getGithubOAuthData(config, code, codeVerifier);

  const accountData: UpsertAccountData = {
    provider: AccountProvider.GITHUB,
    providerId: userInfo.id.toString(),
    accessToken: tokens.access_token,
    refreshToken: undefined,
    expiresAt: undefined,
  };

  const userData: UpsertUserData = {
    email,
    name: userInfo.name ?? userInfo.login,
    avatar: userInfo.avatar_url,
  };

  const { userId } = await upsertAccount(accountData, userData);
  return userId;
};

const getGithubOAuthData = async (
  config: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<GithubOAuthData> => {
  const tokens = await fetchGithubToken(config, code, codeVerifier);
  const userInfo = await fetchGithubUserInfo(config.userInfoUrl, tokens.access_token);
  const email = await getGithubUserEmail(tokens.access_token, userInfo.email, tokens.scope);
  return { tokens, userInfo, email };
};

const fetchGithubToken = async (
  config: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<GithubTokenResponse> => {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  return await fetchJsonOrThrow<GithubTokenResponse>(
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

const fetchGithubUserInfo = async (userInfoUrl: string, token: string): Promise<GithubUserInfo> => {
  return await fetchJsonOrThrow<GithubUserInfo>(
    userInfoUrl,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": githubApiVersion,
        "User-Agent": "todo",
      },
    },
    "Failed to fetch user info",
  );
};

const getGithubUserEmail = async (
  token: string,
  profileEmail: string | null,
  grantedScopes: string,
): Promise<string> => {
  if (profileEmail) {
    return profileEmail;
  }

  const scopes = grantedScopes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const hasUserEmailScope = scopes.includes("user:email") || scopes.includes("user");
  if (!hasUserEmailScope) {
    throw new Error("Missing required GitHub scope: user:email");
  }

  const emails = await fetchJsonOrThrow<GithubEmail[]>(
    "https://api.github.com/user/emails",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": githubApiVersion,
        "User-Agent": "todo",
      },
    },
    "Failed to fetch user emails",
  );
  const primaryEmail = emails.find((e) => e.primary && e.verified);

  if (!primaryEmail) {
    throw new Error("No verified primary email found");
  }

  return primaryEmail.email;
};

type GithubOAuthCookiePayload = {
  state: string;
  codeVerifier: string;
};

const isGithubOAuthCookiePayload = (value: unknown): value is GithubOAuthCookiePayload => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<GithubOAuthCookiePayload>;
  return typeof v.state === "string" && typeof v.codeVerifier === "string";
};
