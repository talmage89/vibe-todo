import { Elysia } from "elysia";
import { type AuthUser, authMiddleware, requireAuth } from "~/platform/auth/middleware";
import * as crossProjectService from "./cross-project-service";

type HandlerProps = {
  user: AuthUser | undefined;
};

async function getInboxHandler({ user }: HandlerProps) {
  const authenticatedUser = requireAuth(user);
  const result = await crossProjectService.getInboxTasks(authenticatedUser.id);
  return { success: true, ...result };
}

async function getTodayHandler({ user }: HandlerProps) {
  const authenticatedUser = requireAuth(user);
  const result = await crossProjectService.getTodayTasks(authenticatedUser.id);
  return { success: true, ...result };
}

async function getUpcomingHandler({ user }: HandlerProps) {
  const authenticatedUser = requireAuth(user);
  const result = await crossProjectService.getUpcomingTasks(authenticatedUser.id);
  return { success: true, ...result };
}

export const crossProjectTaskRoutes = new Elysia()
  .use(authMiddleware)
  .get("/tasks/inbox", getInboxHandler)
  .get("/tasks/today", getTodayHandler)
  .get("/tasks/upcoming", getUpcomingHandler);
