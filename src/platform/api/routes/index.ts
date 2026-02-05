import type { Elysia } from "elysia";
import { ApiError } from "~/platform/auth/errors";
import { projectRoutes } from "./projects";
import { sectionRoutes } from "./sections";
import { subtaskRoutes } from "./subtasks";
import { tagRoutes } from "./tags";
import { taskRoutes } from "./tasks";
import { userRoutes } from "./user";

export const registerApiRoutes = (app: Elysia) => {
  app.group("/api", (api) =>
    api
      .error({ ApiError })
      .onError(({ error, set }) => {
        if (error instanceof ApiError) {
          set.status = error.status;
          return { success: false, error: error.message };
        }

        console.error("API Error:", error);
        set.status = 500;
        return { success: false, error: "Internal server error" };
      })
      .use(userRoutes)
      .use(projectRoutes)
      .use(sectionRoutes)
      .use(taskRoutes)
      .use(subtaskRoutes)
      .use(tagRoutes),
  );

  return app;
};
