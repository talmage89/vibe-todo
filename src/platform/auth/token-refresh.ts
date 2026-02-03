import { db } from "~/platform/db";
import { AccountProvider } from "~/platform/db/generated";
import { getGoogleConfig } from "./config";
import { fetchJsonOrThrow } from "./http";

interface GoogleRefreshResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

/**
 * Refreshes the Google OAuth access token for a user's account.
 * Returns the new access token, or null if refresh is not possible.
 */
export const refreshGoogleToken = async (userId: string): Promise<string | null> => {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: AccountProvider.GOOGLE,
    },
    select: {
      id: true,
      refreshToken: true,
      expiresAt: true,
      accessToken: true,
    },
  });

  if (!account || !account.refreshToken) {
    return null;
  }

  // Token is still valid - return existing token
  if (account.expiresAt && account.expiresAt > new Date()) {
    return account.accessToken;
  }

  const config = getGoogleConfig();

  try {
    const tokens = await fetchGoogleRefreshToken(config, account.refreshToken);

    // Update the account with new tokens
    await db.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  } catch (error) {
    console.error("Failed to refresh Google token:", error);
    return null;
  }
};

const fetchGoogleRefreshToken = async (
  config: { clientId: string; clientSecret: string; tokenUrl: string },
  refreshToken: string,
): Promise<GoogleRefreshResponse> => {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  return await fetchJsonOrThrow<GoogleRefreshResponse>(
    config.tokenUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    },
    "Failed to refresh Google token",
  );
};

/**
 * Gets a valid access token for a user, refreshing if necessary.
 * Returns null if the user has no Google account or refresh fails.
 */
export const getValidGoogleToken = async (userId: string): Promise<string | null> => {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: AccountProvider.GOOGLE,
    },
    select: {
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
    },
  });

  if (!account) {
    return null;
  }

  // Check if token is still valid (with 5 minute buffer)
  const bufferMs = 5 * 60 * 1000;
  if (account.expiresAt && account.expiresAt.getTime() > Date.now() + bufferMs) {
    return account.accessToken;
  }

  // Token expired or about to expire - refresh it
  return await refreshGoogleToken(userId);
};
