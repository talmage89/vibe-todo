import { verifyProjectAccess } from "~/platform/api/access";
import { ValidationError } from "~/platform/auth/errors";
import { db } from "~/platform/db";

type UpdateProjectData = {
  name?: string;
  color?: string | null;
};

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
  return verifyProjectAccess(userId, projectId);
}

export async function updateProject(userId: string, projectId: string, data: UpdateProjectData) {
  await verifyProjectAccess(userId, projectId);

  if (data.name !== undefined && data.name.trim().length === 0) {
    throw new ValidationError("Project name cannot be empty");
  }

  return db.project.update({
    where: { id: projectId },
    data: {
      name: data.name?.trim(),
      color: data.color,
    },
  });
}

export async function deleteProject(userId: string, projectId: string) {
  await verifyProjectAccess(userId, projectId);
  await db.project.delete({ where: { id: projectId } });
}
