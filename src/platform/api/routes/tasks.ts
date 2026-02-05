import { Elysia } from "elysia";
import { z } from "zod";
import { AuthorizationError, NotFoundError, ValidationError } from "~/platform/auth/errors";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { db } from "~/platform/db";

async function verifyProjectAccess(userId: string, projectId: string) {
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

async function verifyTaskAccess(userId: string, projectId: string, taskId: string) {
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

const getTasksQuerySchema = z.object({
  sectionId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
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
      ...(query.status !== undefined && { status: query.status }),
      ...(query.priority !== undefined && { priority: query.priority }),
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
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
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
      priority: body.priority ?? "NONE",
      status: body.status ?? "TODO",
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

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  if (task.projectId !== params.projectId) {
    throw new NotFoundError("Task not found in this project");
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
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
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
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.status !== undefined && { status: body.status }),
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
  await verifyTaskAccess(authenticatedUser.id, params.projectId, params.taskId);

  const subtask = await db.subtask.findUnique({
    where: { id: params.subtaskId },
  });

  if (!subtask) {
    throw new NotFoundError("Subtask not found");
  }

  if (subtask.taskId !== params.taskId) {
    throw new NotFoundError("Subtask not found in this task");
  }

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
  await verifyTaskAccess(authenticatedUser.id, params.projectId, params.taskId);

  const subtask = await db.subtask.findUnique({
    where: { id: params.subtaskId },
  });

  if (!subtask) {
    throw new NotFoundError("Subtask not found");
  }

  if (subtask.taskId !== params.taskId) {
    throw new NotFoundError("Subtask not found in this task");
  }

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

const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be 50 characters or less")
    .transform((val) => val.trim()),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"),
});

type CreateTagHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
  body: z.infer<typeof createTagSchema>;
};

async function createTagHandler({ user, params, body }: CreateTagHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);

  const existingTag = await db.tag.findUnique({
    where: {
      name_projectId: {
        name: body.name,
        projectId: params.projectId,
      },
    },
  });

  if (existingTag) {
    throw new ValidationError("A tag with this name already exists in this project");
  }

  const tag = await db.tag.create({
    data: {
      name: body.name,
      color: body.color,
      projectId: params.projectId,
    },
  });

  return { success: true, tag };
}

type GetTagsHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
};

async function getTagsHandler({ user, params }: GetTagsHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);

  const tags = await db.tag.findMany({
    where: { projectId: params.projectId },
    orderBy: { name: "asc" },
  });

  return { success: true, tags };
}

const updateTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be 50 characters or less")
    .transform((val) => val.trim())
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional(),
});

type UpdateTagHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; tagId: string };
  body: z.infer<typeof updateTagSchema>;
};

async function updateTagHandler({ user, params, body }: UpdateTagHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);

  const tag = await db.tag.findUnique({
    where: { id: params.tagId },
  });

  if (!tag) {
    throw new NotFoundError("Tag not found");
  }

  if (tag.projectId !== params.projectId) {
    throw new NotFoundError("Tag not found in this project");
  }

  if (body.name !== undefined && body.name !== tag.name) {
    const existingTag = await db.tag.findUnique({
      where: {
        name_projectId: {
          name: body.name,
          projectId: params.projectId,
        },
      },
    });

    if (existingTag) {
      throw new ValidationError("A tag with this name already exists in this project");
    }
  }

  const updatedTag = await db.tag.update({
    where: { id: params.tagId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.color !== undefined && { color: body.color }),
    },
  });

  return { success: true, tag: updatedTag };
}

type DeleteTagHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; tagId: string };
};

async function deleteTagHandler({ user, params }: DeleteTagHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);

  const tag = await db.tag.findUnique({
    where: { id: params.tagId },
  });

  if (!tag) {
    throw new NotFoundError("Tag not found");
  }

  if (tag.projectId !== params.projectId) {
    throw new NotFoundError("Tag not found in this project");
  }

  await db.tag.delete({
    where: { id: params.tagId },
  });

  return { success: true };
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
  })
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
  })
  .get("/projects/:projectId/tags", getTagsHandler)
  .post("/projects/:projectId/tags", createTagHandler, {
    body: createTagSchema,
  })
  .patch("/projects/:projectId/tags/:tagId", updateTagHandler, {
    body: updateTagSchema,
  })
  .delete("/projects/:projectId/tags/:tagId", deleteTagHandler);
