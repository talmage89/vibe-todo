import { Elysia } from "elysia";
import { z } from "zod";
import { verifySubtaskAccess, verifyTaskAccess } from "~/platform/api/access";
import { ValidationError } from "~/platform/auth/errors";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { db } from "~/platform/db";

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

  const maxPositionResult = await db.subtask.aggregate({
    where: { taskId: params.taskId },
    _max: { position: true },
  });

  const nextPosition = (maxPositionResult._max.position ?? -1) + 1;

  const subtask = await db.subtask.create({
    data: {
      title: body.title,
      position: nextPosition,
      taskId: params.taskId,
    },
  });

  return { success: true, subtask };
}

type GetSubtasksHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; taskId: string };
};

async function getSubtasksHandler({ user, params }: GetSubtasksHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyTaskAccess(authenticatedUser.id, params.projectId, params.taskId);

  const subtasks = await db.subtask.findMany({
    where: { taskId: params.taskId },
    orderBy: { position: "asc" },
  });

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

  const updatedSubtask = await db.subtask.update({
    where: { id: params.subtaskId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.completed !== undefined && { completed: body.completed }),
    },
  });

  return { success: true, subtask: updatedSubtask };
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

  await db.subtask.delete({
    where: { id: params.subtaskId },
  });

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

  const subtasks = await db.subtask.findMany({
    where: { taskId: params.taskId },
    select: { id: true },
  });

  const existingIds = new Set(subtasks.map((s) => s.id));
  const providedIds = new Set(body.subtaskIds);

  for (const id of body.subtaskIds) {
    if (!existingIds.has(id)) {
      throw new ValidationError(`Subtask ${id} not found in this task`);
    }
  }

  for (const id of existingIds) {
    if (!providedIds.has(id)) {
      throw new ValidationError("All subtasks must be included in reorder");
    }
  }

  await db.$transaction(
    body.subtaskIds.map((id, index) =>
      db.subtask.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  const updatedSubtasks = await db.subtask.findMany({
    where: { taskId: params.taskId },
    orderBy: { position: "asc" },
  });

  return { success: true, subtasks: updatedSubtasks };
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
