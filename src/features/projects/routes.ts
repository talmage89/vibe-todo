import { Elysia } from "elysia";
import { z } from "zod";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import * as projectService from "./service";

async function getProjectsHandler({ user }: { user: AuthUser | undefined }) {
  const authenticatedUser = requireAuth(user);
  const projects = await projectService.listProjects(authenticatedUser.id);
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
  const project = await projectService.createProject(authenticatedUser.id, body.name, body.color);
  return { success: true, project };
}

type GetProjectHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
};

async function getProjectHandler({ user, params }: GetProjectHandlerProps) {
  const authenticatedUser = requireAuth(user);
  const project = await projectService.getProject(authenticatedUser.id, params.projectId);
  return { success: true, project };
}

const updateProjectSchema = z.object({
  name: z.string().optional(),
  color: z.union([z.string(), z.null()]).optional(),
  defaultView: z.enum(["LIST", "KANBAN"]).optional(),
});

type UpdateProjectHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
  body: z.infer<typeof updateProjectSchema>;
};

async function updateProjectHandler({ user, params, body }: UpdateProjectHandlerProps) {
  const authenticatedUser = requireAuth(user);
  const project = await projectService.updateProject(authenticatedUser.id, params.projectId, body);
  return { success: true, project };
}

type DeleteProjectHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
};

async function deleteProjectHandler({ user, params }: DeleteProjectHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await projectService.deleteProject(authenticatedUser.id, params.projectId);
  return { success: true };
}

export const projectRoutes = new Elysia()
  .use(authMiddleware)
  .get("/projects", getProjectsHandler)
  .get("/projects/:projectId", getProjectHandler)
  .post("/projects", createProjectHandler, { body: createProjectSchema })
  .patch("/projects/:projectId", updateProjectHandler, { body: updateProjectSchema })
  .delete("/projects/:projectId", deleteProjectHandler);
