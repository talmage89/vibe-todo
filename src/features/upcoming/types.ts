import type { Task } from "~/features/tasks/types";

export type CrossProjectTask = Task & {
  project: {
    id: string;
    name: string;
    color: string | null;
  };
};

export interface CrossProjectTasksResponse {
  success: boolean;
  tasks: CrossProjectTask[];
}
