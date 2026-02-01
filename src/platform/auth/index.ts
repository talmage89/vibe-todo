export { AuthProvider, ProtectedRoute, useAuth } from "./client";
export type { OAuthProvider } from "./config";
export { getGithubConfig, getGoogleConfig, getSessionConfig } from "./config";
export { registerGoogleOAuth } from "./google";
export type { AuthUser } from "./middleware";
export { authMiddleware, requireAuth } from "./middleware";
