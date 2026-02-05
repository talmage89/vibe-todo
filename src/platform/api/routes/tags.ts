import { Elysia } from "elysia";
import { z } from "zod";
import { verifyProjectAccess, verifyTagAccess } from "~/platform/api/access";
import { ValidationError } from "~/platform/auth/errors";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { db } from "~/platform/db";

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
  const tag = await verifyTagAccess(authenticatedUser.id, params.projectId, params.tagId);

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
  await verifyTagAccess(authenticatedUser.id, params.projectId, params.tagId);

  await db.tag.delete({
    where: { id: params.tagId },
  });

  return { success: true };
}

export const tagRoutes = new Elysia()
  .use(authMiddleware)
  .get("/projects/:projectId/tags", getTagsHandler)
  .post("/projects/:projectId/tags", createTagHandler, {
    body: createTagSchema,
  })
  .patch("/projects/:projectId/tags/:tagId", updateTagHandler, {
    body: updateTagSchema,
  })
  .delete("/projects/:projectId/tags/:tagId", deleteTagHandler);
