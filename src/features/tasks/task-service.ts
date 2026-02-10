import { getNextTaskPosition, reorderTasks } from "~/platform/api/position";
import { ValidationError } from "~/platform/auth/errors";
import { db } from "~/platform/db";
import { TaskPriority, TaskStatus } from "~/platform/db/generated";

type CreateTaskData = {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  status?: TaskStatus;
  tagIds?: string[];
};

type UpdateTaskData = {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  tagIds?: string[];
};

const taskInclude = {
  subtasks: { orderBy: { position: "asc" as const } },
  tags: true,
} as const;

const DEFAULT_PAGE_SIZE = 50;

type ListTasksOptions = {
  status?: TaskStatus;
  priority?: TaskPriority;
  cursor?: string;
  limit?: number;
};

export async function listTasks(projectId: string, options?: ListTasksOptions) {
  const limit = Math.min(options?.limit ?? DEFAULT_PAGE_SIZE, 100);

  const tasks = await db.task.findMany({
    where: {
      projectId,
      status: options?.status,
      priority: options?.priority,
    },
    include: taskInclude,
    orderBy: { position: "asc" },
    take: limit + 1,
    ...(options?.cursor && {
      cursor: { id: options.cursor },
      skip: 1,
    }),
  });

  const hasMore = tasks.length > limit;
  const items = hasMore ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { tasks: items, nextCursor, hasMore };
}

export async function createTask(userId: string, projectId: string, data: CreateTaskData) {
  if (data.tagIds && data.tagIds.length > 0) {
    const tags = await db.tag.findMany({
      where: { id: { in: data.tagIds }, projectId },
    });
    if (tags.length !== data.tagIds.length) {
      throw new ValidationError("One or more tags not found in this project");
    }
  }

  const position = await getNextTaskPosition(projectId);

  return db.task.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority ?? TaskPriority.NONE,
      status: data.status ?? TaskStatus.TODO,
      position,
      userId,
      projectId,
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

export async function updateTask(projectId: string, taskId: string, data: UpdateTaskData) {
  if (data.tagIds !== undefined && data.tagIds.length > 0) {
    const tags = await db.tag.findMany({
      where: { id: { in: data.tagIds }, projectId },
    });
    if (tags.length !== data.tagIds.length) {
      throw new ValidationError("One or more tags not found in this project");
    }
  }

  return db.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      status: data.status,
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

export async function reorderProjectTasks(projectId: string, taskIds: string[]) {
  await reorderTasks(projectId, taskIds);

  return db.task.findMany({
    where: { projectId },
    include: taskInclude,
    orderBy: { position: "asc" },
  });
}
