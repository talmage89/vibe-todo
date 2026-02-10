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
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { userId: true } } },
  });

  if (!task || task.projectId !== projectId) {
    throw new NotFoundError("Task not found in this project");
  }

  if (task.project.userId !== userId) {
    throw new AuthorizationError("You do not have access to this project");
  }

  return task;
}

export async function verifySectionAccess(userId: string, projectId: string, sectionId: string) {
  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: { project: { select: { userId: true } } },
  });

  if (!section || section.projectId !== projectId) {
    throw new NotFoundError("Section not found in this project");
  }

  if (section.project.userId !== userId) {
    throw new AuthorizationError("You do not have access to this project");
  }

  return section;
}

export async function verifyTagAccess(userId: string, projectId: string, tagId: string) {
  const tag = await db.tag.findUnique({
    where: { id: tagId },
    include: { project: { select: { userId: true } } },
  });

  if (!tag || tag.projectId !== projectId) {
    throw new NotFoundError("Tag not found in this project");
  }

  if (tag.project.userId !== userId) {
    throw new AuthorizationError("You do not have access to this project");
  }

  return tag;
}

export async function verifySubtaskAccess(
  userId: string,
  projectId: string,
  taskId: string,
  subtaskId: string,
) {
  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: { include: { project: { select: { userId: true } } } } },
  });

  if (!subtask || subtask.taskId !== taskId) {
    throw new NotFoundError("Subtask not found in this task");
  }

  if (subtask.task.projectId !== projectId) {
    throw new NotFoundError("Task not found in this project");
  }

  if (subtask.task.project.userId !== userId) {
    throw new AuthorizationError("You do not have access to this project");
  }

  return subtask;
}
