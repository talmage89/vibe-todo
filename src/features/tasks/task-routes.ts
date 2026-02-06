import { Elysia } from "elysia";
import { z } from "zod";
import { verifyProjectAccess, verifyTaskAccess } from "~/platform/api/access";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { TaskPriority, TaskStatus } from "~/platform/db/generated";
import * as taskService from "./task-service";

const getTasksQuerySchema = z.object({
  sectionId: z.string().optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
});

type GetTasksHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
  query: z.infer<typeof getTasksQuerySchema>;
};

async function getTasksHandler({ user, params, query }: GetTasksHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);
  const tasks = await taskService.listTasks(params.projectId, query);
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
  priority: z.enum(TaskPriority).optional(),
  status: z.enum(TaskStatus).optional(),
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
  const task = await taskService.createTask(authenticatedUser.id, params.projectId, body);
  return { success: true, task };
}

type GetTaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
};

async function getTaskHandler({ user, params }: GetTaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);
  const task = await taskService.getTask(params.projectId, params.taskId);
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
  priority: z.enum(TaskPriority).optional(),
  status: z.enum(TaskStatus).optional(),
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
  const task = await taskService.updateTask(params.projectId, params.taskId, existingTask, body);
  return { success: true, task };
}

type DeleteTaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
};

async function deleteTaskHandler({ user, params }: DeleteTaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyTaskAccess(authenticatedUser.id, params.projectId, params.taskId);
  await taskService.deleteTask(params.taskId);
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
  const tasks = await taskService.reorderProjectTasks(
    params.projectId,
    body.sectionId ?? null,
    body.taskIds,
  );
  return { success: true, tasks };
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
