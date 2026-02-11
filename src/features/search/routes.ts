import { Elysia } from "elysia";
import { z } from "zod";
import { verifyProjectAccess } from "~/platform/api/access";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import { TaskPriority, TaskStatus } from "~/platform/db/generated";
import * as searchService from "./service";

const searchQuerySchema = z
  .object({
    q: z.string().optional().default(""),
    status: z.enum(TaskStatus).optional(),
    priority: z.enum(TaskPriority).optional(),
    projectId: z.string().optional(),
    projectName: z.string().optional(),
    dateFilter: z.enum(["overdue", "today"] as const).optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .refine(
    (data) =>
      data.q ||
      data.status ||
      data.priority ||
      data.projectId ||
      data.projectName ||
      data.dateFilter,
    {
      message: "At least one search parameter is required",
    },
  );

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
