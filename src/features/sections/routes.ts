import { Elysia } from "elysia";
import { z } from "zod";
import { verifyProjectAccess, verifySectionAccess } from "~/platform/api/access";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import * as sectionService from "./service";

type GetSectionsHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
};

async function getSectionsHandler({ user, params }: GetSectionsHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);
  const sections = await sectionService.listSections(params.projectId);
  return { success: true, sections };
}

const createSectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(100, "Section name must be 100 characters or less")
    .transform((val) => val.trim()),
});

type CreateSectionHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
  body: z.infer<typeof createSectionSchema>;
};

async function createSectionHandler({ user, params, body }: CreateSectionHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);
  const section = await sectionService.createSection(params.projectId, body.name);
  return { success: true, section };
}

type GetSectionHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; sectionId: string };
};

async function getSectionHandler({ user, params }: GetSectionHandlerProps) {
  const authenticatedUser = requireAuth(user);
  const section = await verifySectionAccess(
    authenticatedUser.id,
    params.projectId,
    params.sectionId,
  );
  return { success: true, section };
}

const updateSectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(100, "Section name must be 100 characters or less")
    .transform((val) => val.trim())
    .optional(),
});

type UpdateSectionHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; sectionId: string };
  body: z.infer<typeof updateSectionSchema>;
};

async function updateSectionHandler({ user, params, body }: UpdateSectionHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifySectionAccess(authenticatedUser.id, params.projectId, params.sectionId);
  const section = await sectionService.updateSection(params.sectionId, body);
  return { success: true, section };
}

type DeleteSectionHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string; sectionId: string };
};

async function deleteSectionHandler({ user, params }: DeleteSectionHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifySectionAccess(authenticatedUser.id, params.projectId, params.sectionId);
  await sectionService.deleteSection(params.sectionId);
  return { success: true };
}

const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string()).min(1, "At least one section ID is required"),
});

type ReorderSectionsHandlerProps = {
  user: AuthUser | undefined;
  params: { projectId: string };
  body: z.infer<typeof reorderSectionsSchema>;
};

async function reorderSectionsHandler({ user, params, body }: ReorderSectionsHandlerProps) {
  const authenticatedUser = requireAuth(user);
  await verifyProjectAccess(authenticatedUser.id, params.projectId);
  const sections = await sectionService.reorderProjectSections(params.projectId, body.sectionIds);
  return { success: true, sections };
}

export const sectionRoutes = new Elysia()
  .use(authMiddleware)
  .get("/projects/:projectId/sections", getSectionsHandler)
  .post("/projects/:projectId/sections", createSectionHandler, {
    body: createSectionSchema,
  })
  .get("/projects/:projectId/sections/:sectionId", getSectionHandler)
  .patch("/projects/:projectId/sections/:sectionId", updateSectionHandler, {
    body: updateSectionSchema,
  })
  .delete("/projects/:projectId/sections/:sectionId", deleteSectionHandler)
  .post("/projects/:projectId/sections/reorder", reorderSectionsHandler, {
    body: reorderSectionsSchema,
  });
