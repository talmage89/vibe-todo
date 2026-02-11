import type { Task } from "~/features/tasks/types";

export type SearchTask = Task & {
  project: { id: string; name: string; color: string | null };
};

export interface SearchTasksResponse {
  tasks: SearchTask[];
}
