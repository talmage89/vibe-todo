import { Elysia } from "elysia";
import { z } from "zod";
import { verifySubtaskAccess, verifyTaskAccess } from "~/platform/api/access";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import * as subtaskService from "./subtask-service";

const createSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, "Subtask title is required")
    .max(500, "Subtask title must be 500 characters or less")
    .transform((val) => val.trim()),
});

type CreateSubtaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
  body: z.infer<typeof createSubtaskSchema>;
};

async function createSubtaskHandler({ user, params, body }: CreateSubtaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyTaskAccess(authenticatedUser.id, params.projectId, params.taskId);
  const subtask = await subtaskService.createSubtask(params.taskId, body.title);
  return { success: true, subtask };
}

type GetSubtasksHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
};

async function getSubtasksHandler({ user, params }: GetSubtasksHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyTaskAccess(authenticatedUser.id, params.projectId, params.taskId);
  const subtasks = await subtaskService.listSubtasks(params.taskId);
  return { success: true, subtasks };
}

const updateSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, "Subtask title is required")
    .max(500, "Subtask title must be 500 characters or less")
    .transform((val) => val.trim())
    .optional(),
  completed: z.boolean().optional(),
});

type UpdateSubtaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string; subtaskId: string };
  body: z.infer<typeof updateSubtaskSchema>;
};

async function updateSubtaskHandler({ user, params, body }: UpdateSubtaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifySubtaskAccess(
    authenticatedUser.id,
    params.projectId,
    params.taskId,
    params.subtaskId,
  );
  const subtask = await subtaskService.updateSubtask(params.subtaskId, body);
  return { success: true, subtask };
}

type DeleteSubtaskHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string; subtaskId: string };
};

async function deleteSubtaskHandler({ user, params }: DeleteSubtaskHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifySubtaskAccess(
    authenticatedUser.id,
    params.projectId,
    params.taskId,
    params.subtaskId,
  );
  await subtaskService.deleteSubtask(params.subtaskId);
  return { success: true };
}

const reorderSubtasksSchema = z.object({
  subtaskIds: z.array(z.string()).min(1, "At least one subtask ID is required"),
});

type ReorderSubtasksHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
  body: z.infer<typeof reorderSubtasksSchema>;
};

async function reorderSubtasksHandler({ user, params, body }: ReorderSubtasksHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyTaskAccess(authenticatedUser.id, params.projectId, params.taskId);
  const subtasks = await subtaskService.reorderTaskSubtasks(params.taskId, body.subtaskIds);
  return { success: true, subtasks };
}

export const subtaskRoutes = new Elysia()
  .use(authMiddleware)
  .get("/projects/:projectId/tasks/:taskId/subtasks", getSubtasksHandler)
  .post("/projects/:projectId/tasks/:taskId/subtasks", createSubtaskHandler, {
    body: createSubtaskSchema,
  })
  .patch("/projects/:projectId/tasks/:taskId/subtasks/:subtaskId", updateSubtaskHandler, {
    body: updateSubtaskSchema,
  })
  .delete("/projects/:projectId/tasks/:taskId/subtasks/:subtaskId", deleteSubtaskHandler)
  .post("/projects/:projectId/tasks/:taskId/subtasks/reorder", reorderSubtasksHandler, {
    body: reorderSubtasksSchema,
  });
