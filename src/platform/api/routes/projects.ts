import { Elysia } from "elysia";
import { ValidationError } from "~/platform/auth/errors";
import { authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { db } from "~/platform/db";

export const projectRoutes = new Elysia()
  .use(authMiddleware)
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
  });
