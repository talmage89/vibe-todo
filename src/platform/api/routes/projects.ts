import { Elysia } from "elysia";
import { z } from "zod";
import { AuthorizationError, NotFoundError, ValidationError } from "~/platform/auth/errors";
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

type GetProjectHandlerProps = {
  user: AuthUser | undefined;
  params: { id: string };
};

async function getProjectHandler({ user, params }: GetProjectHandlerProps) {
  const authenticatedUser = requireAuth(user);

  const project = await db.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.userId !== authenticatedUser.id) {
    throw new AuthorizationError("You do not have access to this project");
  }

  return { success: true, project };
}

const updateProjectSchema = z.object({
  name: z.string().optional(),
  color: z.union([z.string(), z.null()]).optional(),
});

type UpdateProjectHandlerProps = {
  user: AuthUser | undefined;
  params: { id: string };
  body: z.infer<typeof updateProjectSchema>;
};

async function updateProjectHandler({ user, params, body }: UpdateProjectHandlerProps) {
  const authenticatedUser = requireAuth(user);

  const project = await db.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.userId !== authenticatedUser.id) {
    throw new AuthorizationError("You do not have access to this project");
  }

  if (body.name !== undefined && body.name.trim().length === 0) {
    throw new ValidationError("Project name cannot be empty");
  }

  const updatedProject = await db.project.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.color !== undefined && { color: body.color }),
    },
  });

  return { success: true, project: updatedProject };
}

type DeleteProjectHandlerProps = {
  user: AuthUser | undefined;
  params: { id: string };
};

async function deleteProjectHandler({ user, params }: DeleteProjectHandlerProps) {
  const authenticatedUser = requireAuth(user);

  const project = await db.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.userId !== authenticatedUser.id) {
    throw new AuthorizationError("You do not have access to this project");
  }

  await db.project.delete({
    where: { id: params.id },
  });

  return { success: true };
}

export const projectRoutes = new Elysia()
  .use(authMiddleware)
  .get("/projects", getProjectsHandler)
  .get("/projects/:id", getProjectHandler)
  .post("/projects", createProjectHandler, {
    body: createProjectSchema,
  })
  .patch("/projects/:id", updateProjectHandler, {
    body: updateProjectSchema,
  })
  .delete("/projects/:id", deleteProjectHandler);
