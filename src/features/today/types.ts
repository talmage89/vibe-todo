import type { Task } from "~/features/tasks/types";

export type TaskWithProject = Task & {
  project: { id: string; name: string; color: string };
};
