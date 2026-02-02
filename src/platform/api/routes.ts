import type { Elysia } from "elysia";
import { authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { ApiError } from "../auth/errors";

/**
 * Registers protected API routes.
 * All routes under /api are protected by auth middleware.
 */
export const registerApiRoutes = (app: Elysia) => {
  app.group("/api", (api) =>
    api
      .use(authMiddleware)
      .error({ ApiError })
      .onError(({ error, set }) => {
        if (error instanceof ApiError) {
          set.status = error.status;
          return { success: false, error: error.message };
        }

        console.error("API Error:", error);
        set.status = 500;
        return { success: false, error: "Internal server error" };
      })
      .get("/me", ({ user }) => {
        const authenticatedUser = requireAuth(user);
        return {
          success: true,
          user: {
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            name: authenticatedUser.name,
            avatar: authenticatedUser.avatar,
            createdAt: authenticatedUser.createdAt,
          },
        };
      }),
  );

  return app;
};
