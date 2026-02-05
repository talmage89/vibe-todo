import type { Elysia } from "elysia";
import { authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { ApiError, ValidationError } from "../auth/errors";
import { db } from "../db";

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
      })
      .get("/projects", async ({ user }) => {
        const authenticatedUser = requireAuth(user);
        const projects = await db.project.findMany({
          where: { userId: authenticatedUser.id },
          orderBy: { createdAt: "asc" },
        });
        return { success: true, projects };
      })
      .post("/projects", async ({ user, body }) => {
        const authenticatedUser = requireAuth(user);
        const { name, color } = body as { name?: string; color?: string };

        if (!name || typeof name !== "string") {
          throw new ValidationError("Project name is required");
        }

        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
          throw new ValidationError("Project name is required");
        }
        if (trimmedName.length > 100) {
          throw new ValidationError("Project name must be 100 characters or less");
        }

        const existingProject = await db.project.findFirst({
          where: {
            userId: authenticatedUser.id,
            name: trimmedName,
          },
        });

        if (existingProject) {
          throw new ValidationError("A project with this name already exists");
        }

        const project = await db.project.create({
          data: {
            name: trimmedName,
            color: color || null,
            userId: authenticatedUser.id,
          },
        });

        return { success: true, project };
      }),
  );

  return app;
};
