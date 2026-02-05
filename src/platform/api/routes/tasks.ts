import { Elysia } from "elysia";
import { z } from "zod";
import { verifyProjectAccess, verifyTaskAccess } from "~/platform/api/access";
import { ValidationError } from "~/platform/auth/errors";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { db } from "~/platform/db";
import { TaskPriority, TaskStatus } from "~/platform/db/generated";

const taskPriorityValues = Object.values(TaskPriority) as [string, ...string[]];
const taskStatusValues = Object.values(TaskStatus) as [string, ...string[]];

const getTasksQuerySchema = z.object({
  sectionId: z.string().optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
});

type GetTasksHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
  query: z.infer<typeof getTasksQuerySchema>;
};

async function getTasksHandler({ user, params, query }: GetTasksHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);

  const tasks = await db.task.findMany({
    where: {
      projectId: params.projectId,
      ...(query.sectionId !== undefined && { sectionId: query.sectionId }),
      ...(query.status !== undefined && { status: query.status as TaskStatus }),
      ...(query.priority !== undefined && { priority: query.priority as TaskPriority }),
    },
    include: {
      subtasks: {
        orderBy: { position: "asc" },
      },
      tags: true,
    },
    orderBy: { position: "asc" },
  });

  return { success: true, tasks };
}

const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(500, "Task title must be 500 characters or less")
    .transform((val) => val.trim()),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(taskPriorityValues).optional(),
  status: z.enum(taskStatusValues).optional(),
  sectionId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

type CreateTaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
  body: z.infer<typeof createTaskSchema>;
};

async function createTaskHandler({ user, params, body }: CreateTaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);

  if (body.sectionId) {
    const section = await db.section.findUnique({
      where: { id: body.sectionId },
    });

    if (!section || section.projectId !== params.projectId) {
      throw new ValidationError("Section not found in this project");
    }
  }

  if (body.tagIds && body.tagIds.length > 0) {
    const tags = await db.tag.findMany({
      where: { id: { in: body.tagIds }, projectId: params.projectId },
    });

    if (tags.length !== body.tagIds.length) {
      throw new ValidationError("One or more tags not found in this project");
    }
  }

  const maxPositionResult = await db.task.aggregate({
    where: {
      projectId: params.projectId,
      sectionId: body.sectionId ?? null,
    },
    _max: { position: true },
  });

  const nextPosition = (maxPositionResult._max.position ?? -1) + 1;

  const task = await db.task.create({
    data: {
      title: body.title,
      description: body.description,
      dueDate: body.dueDate,
      priority: (body.priority as TaskPriority) ?? TaskPriority.NONE,
      status: (body.status as TaskStatus) ?? TaskStatus.TODO,
      position: nextPosition,
      userId: authenticatedUser.id,
      projectId: params.projectId,
      sectionId: body.sectionId ?? null,
      ...(body.tagIds &&
        body.tagIds.length > 0 && {
          tags: { connect: body.tagIds.map((id) => ({ id })) },
        }),
    },
    include: {
      subtasks: {
        orderBy: { position: "asc" },
      },
      tags: true,
    },
  });

  return { success: true, task };
}

type GetTaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
};

async function getTaskHandler({ user, params }: GetTaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);

  const task = await db.task.findUnique({
    where: { id: params.taskId },
    include: {
      subtasks: {
        orderBy: { position: "asc" },
      },
      tags: true,
    },
  });

  if (!task || task.projectId !== params.projectId) {
    throw new ValidationError("Task not found in this project");
  }

  return { success: true, task };
}

const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(500, "Task title must be 500 characters or less")
    .transform((val) => val.trim())
    .optional(),
  description: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  priority: z.enum(taskPriorityValues).optional(),
  status: z.enum(taskStatusValues).optional(),
  sectionId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

type UpdateTaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
  body: z.infer<typeof updateTaskSchema>;
};

async function updateTaskHandler({ user, params, body }: UpdateTaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  const existingTask = await verifyTaskAccess(
    authenticatedUser.id,
    params.projectId,
    params.taskId,
  );

  if (body.sectionId !== undefined && body.sectionId !== null) {
    const section = await db.section.findUnique({
      where: { id: body.sectionId },
    });

    if (!section || section.projectId !== params.projectId) {
      throw new ValidationError("Section not found in this project");
    }
  }

  if (body.tagIds !== undefined) {
    if (body.tagIds.length > 0) {
      const tags = await db.tag.findMany({
        where: { id: { in: body.tagIds }, projectId: params.projectId },
      });

      if (tags.length !== body.tagIds.length) {
        throw new ValidationError("One or more tags not found in this project");
      }
    }
  }

  let newPosition = existingTask.position;
  if (body.sectionId !== undefined && body.sectionId !== existingTask.sectionId) {
    const maxPositionResult = await db.task.aggregate({
      where: {
        projectId: params.projectId,
        sectionId: body.sectionId,
      },
      _max: { position: true },
    });
    newPosition = (maxPositionResult._max.position ?? -1) + 1;
  }

  const task = await db.task.update({
    where: { id: params.taskId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      ...(body.priority !== undefined && { priority: body.priority as TaskPriority }),
      ...(body.status !== undefined && { status: body.status as TaskStatus }),
      ...(body.sectionId !== undefined && {
        sectionId: body.sectionId,
        position: newPosition,
      }),
      ...(body.tagIds !== undefined && {
        tags: { set: body.tagIds.map((id) => ({ id })) },
      }),
    },
    include: {
      subtasks: {
        orderBy: { position: "asc" },
      },
      tags: true,
    },
  });

  return { success: true, task };
}

type DeleteTaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
};

async function deleteTaskHandler({ user, params }: DeleteTaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyTaskAccess(authenticatedUser.id, params.projectId, params.taskId);

  await db.task.delete({
    where: { id: params.taskId },
  });

  return { success: true };
}

const reorderTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, "At least one task ID is required"),
  sectionId: z.string().nullable().optional(),
});

type ReorderTasksHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
  body: z.infer<typeof reorderTasksSchema>;
};

async function reorderTasksHandler({ user, params, body }: ReorderTasksHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);

  const targetSectionId = body.sectionId ?? null;

  const tasks = await db.task.findMany({
    where: {
      projectId: params.projectId,
      sectionId: targetSectionId,
    },
    select: { id: true },
  });

  const existingIds = new Set(tasks.map((t) => t.id));
  const providedIds = new Set(body.taskIds);

  for (const id of body.taskIds) {
    if (!existingIds.has(id)) {
      throw new ValidationError(`Task ${id} not found in this section`);
    }
  }

  for (const id of existingIds) {
    if (!providedIds.has(id)) {
      throw new ValidationError("All tasks in the section must be included in reorder");
    }
  }

  await db.$transaction(
    body.taskIds.map((id, index) =>
      db.task.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  const updatedTasks = await db.task.findMany({
    where: {
      projectId: params.projectId,
      sectionId: targetSectionId,
    },
    include: {
      subtasks: {
        orderBy: { position: "asc" },
      },
      tags: true,
    },
    orderBy: { position: "asc" },
  });

  return { success: true, tasks: updatedTasks };
}

export const taskRoutes = new Elysia()
  .use(authMiddleware)
  .get("/projects/:projectId/tasks", getTasksHandler, {
    query: getTasksQuerySchema,
  })
  .post("/projects/:projectId/tasks", createTaskHandler, {
    body: createTaskSchema,
  })
  .get("/projects/:projectId/tasks/:taskId", getTaskHandler)
  .patch("/projects/:projectId/tasks/:taskId", updateTaskHandler, {
    body: updateTaskSchema,
  })
  .delete("/projects/:projectId/tasks/:taskId", deleteTaskHandler)
  .post("/projects/:projectId/tasks/reorder", reorderTasksHandler, {
    body: reorderTasksSchema,
  });
