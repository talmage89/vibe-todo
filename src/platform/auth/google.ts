import type { Elysia } from "elysia";
import { db } from "~/platform/db";
import { getGoogleConfig } from "./config";

/**
 * Google OAuth user info response
 */
interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

/**
 * Google OAuth token response
 */
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Register Google OAuth routes
 */
export const registerGoogleOAuth = (app: Elysia) => {
  const config = getGoogleConfig();

  // Redirect to Google OAuth
  app.get("/auth/google", ({ set }) => {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    const url = `${config.authorizationUrl}?${params.toString()}`;
    set.redirect = url;
  });

  // Handle Google OAuth callback
  app.get("/auth/google/callback", async ({ query, cookie, set }) => {
    const { code, error } = query as { code?: string; error?: string };

    if (error || !code) {
      set.status = 400;
      return { error: "Authorization failed", details: error };
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        set.status = 500;
        return { error: "Failed to exchange code for tokens", details: errorData };
      }

      const tokens: GoogleTokenResponse = await tokenResponse.json();

      // Fetch user profile
      const userInfoResponse = await fetch(config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        set.status = 500;
        return { error: "Failed to fetch user info" };
      }

      const userInfo: GoogleUserInfo = await userInfoResponse.json();

      // Create or update user and account
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Check if account already exists
      const existingAccount = await db.account.findUnique({
        where: {
          provider_providerId: {
            provider: "google",
            providerId: userInfo.id,
          },
        },
        include: {
          user: true,
        },
      });

      let userId: string;

      if (existingAccount) {
        // Update existing account tokens
        await db.account.update({
          where: { id: existingAccount.id },
          data: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt,
            idToken: tokens.id_token,
            scope: tokens.scope,
            tokenType: tokens.token_type,
          },
        });

        userId = existingAccount.userId;
      } else {
        // Check if user exists with same email (for account linking)
        const existingUser = await db.user.findUnique({
          where: { email: userInfo.email },
        });

        if (existingUser) {
          // Link new account to existing user
          await db.account.create({
            data: {
              provider: "google",
              providerId: userInfo.id,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt,
              idToken: tokens.id_token,
              scope: tokens.scope,
              tokenType: tokens.token_type,
              userId: existingUser.id,
            },
          });

          // Update user info if not set
          await db.user.update({
            where: { id: existingUser.id },
            data: {
              name: existingUser.name || userInfo.name,
              avatar: existingUser.avatar || userInfo.picture,
            },
          });

          userId = existingUser.id;
        } else {
          // Create new user and account
          const newUser = await db.user.create({
            data: {
              email: userInfo.email,
              name: userInfo.name,
              avatar: userInfo.picture,
              accounts: {
                create: {
                  provider: "google",
                  providerId: userInfo.id,
                  accessToken: tokens.access_token,
                  refreshToken: tokens.refresh_token,
                  expiresAt,
                  idToken: tokens.id_token,
                  scope: tokens.scope,
                  tokenType: tokens.token_type,
                },
              },
            },
          });

          userId = newUser.id;
        }
      }

      // Set session cookie
      cookie.session?.set({
        value: userId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });

      // Redirect to app
      set.redirect = "/";
      return { success: true };
    } catch (err) {
      console.error("OAuth error:", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  });

  return app;
};
