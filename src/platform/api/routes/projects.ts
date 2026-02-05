import { Elysia } from "elysia";
import { z } from "zod";
import { ValidationError } from "~/platform/auth/errors";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { db } from "~/platform/db";

async function getProjectsHandler({ user }: { user: AuthUser | undefined }) {
  const authenticatedUser = requireAuth(user);

  const projects = await db.project.findMany({
    where: { userId: authenticatedUser.id },
    orderBy: { createdAt: "asc" },
  });

  return { success: true, projects };
}

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or less")
    .transform((val) => val.trim()),
  color: z.string().optional(),
});

type CreateProjectHandlerProps = {
  user: AuthUser | undefined;
  body: z.infer<typeof createProjectSchema>;
};

async function createProjectHandler({ user, body }: CreateProjectHandlerProps) {
  const authenticatedUser = requireAuth(user);
  const { name, color } = body;

  const existingProject = await db.project.findFirst({
    where: {
      userId: authenticatedUser.id,
      name,
    },
  });

  if (existingProject) {
    throw new ValidationError("A project with this name already exists");
  }

  const project = await db.project.create({
    data: {
      name,
      color: color || null,
      userId: authenticatedUser.id,
    },
  });

  return { success: true, project };
}

export const projectRoutes = new Elysia()
  .use(authMiddleware)
  .get("/projects", getProjectsHandler)
  .post("/projects", createProjectHandler, {
    body: createProjectSchema,
  });
