/**
 * Authentication module exports
 */

// Configuration
export type { OAuthProvider } from "./config";
export { getGithubConfig, getGoogleConfig, getSessionConfig } from "./config";

// OAuth providers
export { registerGoogleOAuth } from "./google";

// Logout
export { registerLogout } from "./logout";
// Session management
export {
  cleanupExpiredSessions,
  createExpiredSessionCookie,
  createSession,
  deleteAllUserSessions,
  deleteSession,
  getSessionFromContext,
  validateSession,
} from "./session";
// Token refresh
export { getValidAccessToken, refreshAccountTokenIfNeeded } from "./token-refresh";
// User management
export { upsertAccount, upsertUser } from "./user";
