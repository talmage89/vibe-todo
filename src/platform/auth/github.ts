import { type Elysia, type Handler, redirect } from "elysia";
import z from "zod";
import { AccountProvider } from "../db/generated";
import { getGithubConfig, type OAuthProvider } from "./config";
import { createSessionCookie } from "./session";
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

export const registerGithubOAuth = (app: Elysia) => {
  const config = getGithubConfig();
  app.get("/auth/github", getGithubOAuthRedirectHandler(config));
  app.get("/auth/github/callback", getGithubOAuthCallbackHandler(config));
  return app;
};

const getGithubOAuthRedirectHandler = (config: OAuthProvider): Handler => {
  return () => {
    const url = buildGithubOAuthUrl(config);
    return redirect(url);
  };
};

const buildGithubOAuthUrl = (config: OAuthProvider) => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
  });

  const url = new URL(config.authorizationUrl);
  url.search = params.toString();

  return url.toString();
};

const getGithubOAuthCallbackHandler = (config: OAuthProvider): Handler => {
  return async ({ query, cookie, set }) => {
    const { success, data, error: zodError } = querySchema.safeParse(query);
    if (!success) {
      set.status = 400;
      return { error: "Authorization failed", details: zodError.message };
    }

    try {
      const userId = await authenticateGithubOAuth(config, data.code);
      const sessionCookie = createSessionCookie(userId);
      cookie.session?.set(sessionCookie);
      return redirect("/");
    } catch (err) {
      console.error("OAuth error:", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  };
};

const querySchema = z.object({
  code: z.string(),
  error: z.never().optional(),
});

type GithubOAuthData = {
  tokens: GithubTokenResponse;
  userInfo: GithubUserInfo;
  email: string;
};

const authenticateGithubOAuth = async (config: OAuthProvider, code: string): Promise<string> => {
  const { tokens, userInfo, email } = await getGithubOAuthData(config, code);

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
): Promise<GithubOAuthData> => {
  const tokens = await fetchGithubToken(config, code);
  const userInfo = await fetchGithubUserInfo(config.userInfoUrl, tokens.access_token);
  const email = await getGithubUserEmail(tokens.access_token, userInfo.email);
  return { tokens, userInfo, email };
};

const fetchGithubToken = async (
  config: OAuthProvider,
  code: string,
): Promise<GithubTokenResponse> => {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    throw new Error(`Failed to exchange code for tokens: ${errorData}`);
  }

  return await tokenResponse.json();
};

const fetchGithubUserInfo = async (userInfoUrl: string, token: string): Promise<GithubUserInfo> => {
  const userInfoResponse = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!userInfoResponse.ok) {
    throw new Error(`Failed to fetch user info: ${userInfoResponse.statusText}`);
  }

  return await userInfoResponse.json();
};

const getGithubUserEmail = async (token: string, profileEmail: string | null): Promise<string> => {
  if (profileEmail) {
    return profileEmail;
  }

  const emailsResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!emailsResponse.ok) {
    throw new Error(`Failed to fetch user emails: ${emailsResponse.statusText}`);
  }

  const emails: GithubEmail[] = await emailsResponse.json();
  const primaryEmail = emails.find((e) => e.primary && e.verified);

  if (!primaryEmail) {
    throw new Error("No verified primary email found");
  }

  return primaryEmail.email;
};
