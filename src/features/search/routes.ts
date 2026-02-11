import { Elysia } from "elysia";
import { z } from "zod";
import { verifyProjectAccess } from "~/platform/api/access";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { TaskPriority, TaskStatus } from "~/platform/db/generated";
import * as searchService from "./service";

const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  projectId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

type SearchHandlerProps = {
  user: AuthUser | undefined;
  query: z.infer<typeof searchQuerySchema>;
};

async function searchHandler({ user, query }: SearchHandlerProps) {
  const authenticatedUser = requireAuth(user);

  if (query.projectId) {
    await verifyProjectAccess(authenticatedUser.id, query.projectId);
  }

  const result = await searchService.search(authenticatedUser.id, query);
  return { success: true, ...result };
}

export const searchRoutes = new Elysia()
  .use(authMiddleware)
  .get("/search", searchHandler, { query: searchQuerySchema });
