import { Elysia } from "elysia";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import * as searchService from "./service";

type HandlerProps = {
  user: AuthUser | undefined;
  query: { q?: string };
};

async function searchHandler({ user, query }: HandlerProps) {
  const authenticatedUser = requireAuth(user);
  const q = query.q?.trim() ?? "";
  if (!q) {
    return { success: true, tasks: [] };
  }
  const result = await searchService.searchTasks(authenticatedUser.id, q);
  return { success: true, ...result };
}

export const searchRoutes = new Elysia().use(authMiddleware).get("/tasks/search", searchHandler);
