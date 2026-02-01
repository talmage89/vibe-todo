import type { Elysia } from "elysia";
import { authMiddleware, requireAuth } from "~/platform/auth/middleware";
import type { User } from "~/platform/db/generated";

/**
 * Registers protected API routes.
 * All routes under /api are protected by auth middleware.
 */
export const registerApiRoutes = (app: Elysia) => {
  app.group("/api", (api) =>
    api
      .use(authMiddleware)
      .get("/me", (context) => {
        const authenticatedUser = requireAuth((context as { user?: User }).user);
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
      })
      .onError(({ error, set }) => {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("Unauthorized")) {
          set.status = 401;
          return { success: false, error: errorMessage };
        }

        console.error("API Error:", error);
        set.status = 500;
        return { success: false, error: "Internal server error" };
      }),
  );

  return app;
};
