import { AuthorizationError, NotFoundError, ValidationError } from "~/platform/auth/errors";
import { db } from "~/platform/db";

export async function listProjects(userId: string) {
  return db.project.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createProject(userId: string, name: string, color?: string) {
  const existing = await db.project.findFirst({
    where: { userId, name },
  });

  if (existing) {
    throw new ValidationError("A project with this name already exists");
  }

  return db.project.create({
    data: { name, color: color || null, userId },
  });
}

export async function getProject(userId: string, projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.userId !== userId) {
    throw new AuthorizationError("You do not have access to this project");
  }

  return project;
}

export async function updateProject(
  userId: string,
  projectId: string,
  data: { name?: string; color?: string | null },
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.userId !== userId) {
    throw new AuthorizationError("You do not have access to this project");
  }

  if (data.name !== undefined && data.name.trim().length === 0) {
    throw new ValidationError("Project name cannot be empty");
  }

  return db.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });
}

export async function deleteProject(userId: string, projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.userId !== userId) {
    throw new AuthorizationError("You do not have access to this project");
  }

  await db.project.delete({ where: { id: projectId } });
}
