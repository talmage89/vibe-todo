import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskUpdates } from "~/features/tasks/types";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";

export type InboxTask = Task & {
  project: { id: string; name: string; color: string | null };
};

interface InboxTasksResponse {
  tasks: InboxTask[];
}

interface TaskResponse {
  task: Task;
}

export function useInboxTasks() {
  const queryClient = useQueryClient();
  const inboxKey = queryKeys.crossProjectTasks.inbox;

  const {
    data: tasks = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: inboxKey,
    queryFn: () => api<InboxTasksResponse>("/api/tasks/inbox"),
    select: (data) => data.tasks,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      projectId,
      taskId,
      updates,
    }: {
      projectId: string;
      taskId: string;
      updates: TaskUpdates;
    }) =>
      api<TaskResponse>(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKey });
    },
  });

  const toggleStatus = async (projectId: string, taskId: string, updates: TaskUpdates) => {
    await updateMutation.mutateAsync({ projectId, taskId, updates });
  };

  const updateTask = async (projectId: string, taskId: string, updates: TaskUpdates) => {
    await updateMutation.mutateAsync({ projectId, taskId, updates });
  };

  return {
    tasks,
    loading,
    error: queryError?.message ?? null,
    toggleStatus,
    updateTask,
  };
}
