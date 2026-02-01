import { type Elysia, type Handler, redirect } from "elysia";
import z from "zod";
import { AccountProvider } from "../db/generated";
import { getGoogleConfig, type OAuthProvider } from "./config";
import { createSession } from "./session";
import { type UpsertAccountData, type UpsertUserData, upsertAccount } from "./user";

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export const registerGoogleOAuth = (app: Elysia) => {
  const config = getGoogleConfig();
  app.get("/auth/google", getGoogleOAuthRedirectHandler(config));
  app.get("/auth/google/callback", getGoogleOAuthCallbackHandler(config));
  return app;
};

const getGoogleOAuthRedirectHandler = (config: OAuthProvider): Handler => {
  return () => {
    const url = buildGoogleOAuthUrl(config);
    return redirect(url);
  };
};

const buildGoogleOAuthUrl = (config: OAuthProvider) => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  const url = new URL(config.authorizationUrl);
  url.search = params.toString();

  return url.toString();
};

const getGoogleOAuthCallbackHandler = (config: OAuthProvider): Handler => {
  return async (context) => {
    const { query, cookie, set, request } = context;
    const { success, data, error: zodError } = querySchema.safeParse(query);
    if (!success) {
      set.status = 400;
      return { error: "Authorization failed", details: zodError.message };
    }

    try {
      const userId = await authenticateGoogleOAuth(config, data.code);

      // Create session with user agent and IP address for security tracking
      const userAgent = request.headers.get("user-agent") ?? undefined;
      const ipAddress =
        request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined;

      const sessionCookie = await createSession(userId, { userAgent, ipAddress });
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

type GoogleOAuthData = {
  tokens: GoogleTokenResponse;
  userInfo: GoogleUserInfo;
};

const authenticateGoogleOAuth = async (config: OAuthProvider, code: string): Promise<string> => {
  const { tokens, userInfo } = await getGoogleOAuthData(config, code);

  const accountData: UpsertAccountData = {
    provider: AccountProvider.GOOGLE,
    providerId: userInfo.id,
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
): Promise<GoogleOAuthData> => {
  const tokens = await fetchGoogleToken(config, code);
  const userInfo = await fetchGoogleUserInfo(config.userInfoUrl, tokens.access_token);
  return { tokens, userInfo };
};

const fetchGoogleToken = async (
  config: OAuthProvider,
  code: string,
): Promise<GoogleTokenResponse> => {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    throw new Error(`Failed to exchange code for tokens: ${errorData}`);
  }

  return await tokenResponse.json();
};

const fetchGoogleUserInfo = async (userInfoUrl: string, token: string): Promise<GoogleUserInfo> => {
  const userInfoResponse = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!userInfoResponse.ok) {
    throw new Error(`Failed to fetch user info: ${userInfoResponse.statusText}`);
  }

  return await userInfoResponse.json();
};
