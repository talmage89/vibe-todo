import { db } from "../db";
import { AccountProvider } from "../db/generated";
import { getGithubConfig, getGoogleConfig } from "./config";

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

/**
 * Refreshes an OAuth access token if it has expired or is about to expire
 * Returns true if token was refreshed, false if refresh was not needed
 */
export const refreshAccountTokenIfNeeded = async (accountId: string): Promise<boolean> => {
  const account = await db.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      provider: true,
      refreshToken: true,
      expiresAt: true,
    },
  });

  if (!account || !account.refreshToken) {
    return false;
  }

  // Check if token is expired or will expire in the next 5 minutes
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() + 5 * 60 * 1000);

  if (!account.expiresAt || account.expiresAt > expiryThreshold) {
    return false; // Token is still valid
  }

  // Refresh the token
  await refreshAccountToken(account.id, account.provider, account.refreshToken);
  return true;
};

/**
 * Refreshes an OAuth access token using the refresh token
 */
const refreshAccountToken = async (
  accountId: string,
  provider: AccountProvider,
  refreshToken: string,
): Promise<void> => {
  const tokenResponse = await fetchRefreshToken(provider, refreshToken);

  await db.account.update({
    where: { id: accountId },
    data: {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? refreshToken, // Some providers don't return a new refresh token
      expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      tokenType: tokenResponse.token_type,
    },
  });
};

/**
 * Fetches a new access token using a refresh token
 */
const fetchRefreshToken = async (
  provider: AccountProvider,
  refreshToken: string,
): Promise<RefreshTokenResponse> => {
  const config = provider === AccountProvider.GOOGLE ? getGoogleConfig() : getGithubConfig();

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh token: ${errorData}`);
  }

  return await response.json();
};

/**
 * Gets a valid access token for an account, refreshing if necessary
 */
export const getValidAccessToken = async (accountId: string): Promise<string | null> => {
  await refreshAccountTokenIfNeeded(accountId);

  const account = await db.account.findUnique({
    where: { id: accountId },
    select: { accessToken: true },
  });

  return account?.accessToken ?? null;
};
