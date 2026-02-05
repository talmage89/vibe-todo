import { AuthorizationError, NotFoundError } from "~/platform/auth/errors";
import { db } from "~/platform/db";

export async function verifyProjectAccess(userId: string, projectId: string) {
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

export async function verifyTaskAccess(userId: string, projectId: string, taskId: string) {
  await verifyProjectAccess(userId, projectId);

  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  if (task.projectId !== projectId) {
    throw new NotFoundError("Task not found in this project");
  }

  return task;
}

export async function verifySectionAccess(userId: string, projectId: string, sectionId: string) {
  await verifyProjectAccess(userId, projectId);

  const section = await db.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    throw new NotFoundError("Section not found");
  }

  if (section.projectId !== projectId) {
    throw new NotFoundError("Section not found in this project");
  }

  return section;
}

export async function verifyTagAccess(userId: string, projectId: string, tagId: string) {
  await verifyProjectAccess(userId, projectId);

  const tag = await db.tag.findUnique({
    where: { id: tagId },
  });

  if (!tag) {
    throw new NotFoundError("Tag not found");
  }

  if (tag.projectId !== projectId) {
    throw new NotFoundError("Tag not found in this project");
  }

  return tag;
}

export async function verifySubtaskAccess(
  userId: string,
  projectId: string,
  taskId: string,
  subtaskId: string,
) {
  await verifyTaskAccess(userId, projectId, taskId);

  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
  });

  if (!subtask) {
    throw new NotFoundError("Subtask not found");
  }

  if (subtask.taskId !== taskId) {
    throw new NotFoundError("Subtask not found in this task");
  }

  return subtask;
}
