import { Elysia } from "elysia";
import { z } from "zod";
import { verifyProjectAccess, verifyTagAccess } from "~/platform/api/access";
import * as tagService from "~/platform/api/services/tag-service";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";

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
  const tag = await tagService.createTag(params.projectId, body.name, body.color);
  return { success: true, tag };
}

type GetTagsHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
};

async function getTagsHandler({ user, params }: GetTagsHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);
  const tags = await tagService.listTags(params.projectId);
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
  const updatedTag = await tagService.updateTag(params.projectId, params.tagId, tag.name, body);
  return { success: true, tag: updatedTag };
}

type DeleteTagHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; tagId: string };
};

async function deleteTagHandler({ user, params }: DeleteTagHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyTagAccess(authenticatedUser.id, params.projectId, params.tagId);
  await tagService.deleteTag(params.tagId);
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
