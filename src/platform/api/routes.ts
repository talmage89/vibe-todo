import type { Elysia } from "elysia";
import { authMiddleware, requireAuth } from "~/platform/auth";

/**
 * Registers protected API routes.
 * All routes under /api are protected by auth middleware.
 */
export const registerApiRoutes = (app: Elysia) => {
  // Create a group for protected API routes
  app.group("/api", (api) =>
    api
      .use(authMiddleware)
      .get("/me", ({ user, error }) => {
        const authenticatedUser = requireAuth({ user, error });
        return {
          success: true,
          user: authenticatedUser,
        };
      })
      .onError(({ error, set }) => {
        const err = error as unknown;
        let errorMessage = String(err);

        if (err && typeof err === "object" && "message" in err) {
          errorMessage = String((err as { message: unknown }).message);
        }

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
