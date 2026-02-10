import type { Elysia } from "elysia";
import { projectRoutes } from "~/features/projects/routes";
import { userRoutes } from "~/features/settings/routes";
import { subtaskRoutes } from "~/features/tasks/subtask-routes";
import { tagRoutes } from "~/features/tasks/tag-routes";
import { taskRoutes } from "~/features/tasks/task-routes";
import { ApiError } from "~/platform/auth/errors";

export const registerApiRoutes = (app: Elysia) => {
  app.group("/api", (api) =>
    api
      .error({ ApiError })
      .onError(({ error, set }) => {
        if (error instanceof ApiError) {
          set.status = error.status;
          return { success: false, error: error.message, code: error.code };
        }

        console.error("API Error:", error);
        set.status = 500;
        return { success: false, error: "Internal server error", code: "INTERNAL_ERROR" };
      })
      .use(userRoutes)
      .use(projectRoutes)
      .use(taskRoutes)
      .use(subtaskRoutes)
      .use(tagRoutes),
  );

  return app;
};
