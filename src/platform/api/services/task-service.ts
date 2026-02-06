import { ValidationError } from "~/platform/auth/errors";
import { db } from "~/platform/db";
import type { TaskPriority, TaskStatus } from "~/platform/db/generated";
import { getNextTaskPosition, reorderTasks } from "./position";

const taskInclude = {
  subtasks: { orderBy: { position: "asc" as const } },
  tags: true,
} as const;

export async function listTasks(
  projectId: string,
  filters?: { sectionId?: string; status?: TaskStatus; priority?: TaskPriority },
) {
  return db.task.findMany({
    where: {
      projectId,
      ...(filters?.sectionId !== undefined && { sectionId: filters.sectionId }),
      ...(filters?.status !== undefined && { status: filters.status }),
      ...(filters?.priority !== undefined && { priority: filters.priority }),
    },
    include: taskInclude,
    orderBy: { position: "asc" },
  });
}

export async function createTask(
  userId: string,
  projectId: string,
  data: {
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: TaskPriority;
    status?: TaskStatus;
    sectionId?: string | null;
    tagIds?: string[];
  },
) {
  if (data.sectionId) {
    const section = await db.section.findUnique({
      where: { id: data.sectionId },
    });
    if (!section || section.projectId !== projectId) {
      throw new ValidationError("Section not found in this project");
    }
  }

  if (data.tagIds && data.tagIds.length > 0) {
    const tags = await db.tag.findMany({
      where: { id: { in: data.tagIds }, projectId },
    });
    if (tags.length !== data.tagIds.length) {
      throw new ValidationError("One or more tags not found in this project");
    }
  }

  const position = await getNextTaskPosition(projectId, data.sectionId ?? null);

  return db.task.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority ?? "NONE",
      status: data.status ?? "TODO",
      position,
      userId,
      projectId,
      sectionId: data.sectionId ?? null,
      ...(data.tagIds &&
        data.tagIds.length > 0 && {
          tags: { connect: data.tagIds.map((id) => ({ id })) },
        }),
    },
    include: taskInclude,
  });
}

export async function getTask(projectId: string, taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });

  if (!task || task.projectId !== projectId) {
    throw new ValidationError("Task not found in this project");
  }

  return task;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  existingTask: { position: number; sectionId: string | null },
  data: {
    title?: string;
    description?: string | null;
    dueDate?: Date | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    sectionId?: string | null;
    tagIds?: string[];
  },
) {
  if (data.sectionId !== undefined && data.sectionId !== null) {
    const section = await db.section.findUnique({
      where: { id: data.sectionId },
    });
    if (!section || section.projectId !== projectId) {
      throw new ValidationError("Section not found in this project");
    }
  }

  if (data.tagIds !== undefined && data.tagIds.length > 0) {
    const tags = await db.tag.findMany({
      where: { id: { in: data.tagIds }, projectId },
    });
    if (tags.length !== data.tagIds.length) {
      throw new ValidationError("One or more tags not found in this project");
    }
  }

  let newPosition = existingTask.position;
  if (data.sectionId !== undefined && data.sectionId !== existingTask.sectionId) {
    newPosition = await getNextTaskPosition(projectId, data.sectionId);
  }

  return db.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.sectionId !== undefined && {
        sectionId: data.sectionId,
        position: newPosition,
      }),
      ...(data.tagIds !== undefined && {
        tags: { set: data.tagIds.map((id) => ({ id })) },
      }),
    },
    include: taskInclude,
  });
}

export async function deleteTask(taskId: string) {
  await db.task.delete({ where: { id: taskId } });
}

export async function reorderProjectTasks(
  projectId: string,
  sectionId: string | null,
  taskIds: string[],
) {
  await reorderTasks(projectId, sectionId, taskIds);

  return db.task.findMany({
    where: { projectId, sectionId },
    include: taskInclude,
    orderBy: { position: "asc" },
  });
}
