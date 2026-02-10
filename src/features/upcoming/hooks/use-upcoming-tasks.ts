import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskUpdates } from "~/features/tasks/types";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { CrossProjectTask, CrossProjectTasksResponse } from "../types";

interface TaskResponse {
  task: CrossProjectTask;
}

export function useUpcomingTasks() {
  const queryClient = useQueryClient();
  const upcomingKey = queryKeys.crossProjectTasks.upcoming;

  const {
    data: tasks = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: upcomingKey,
    queryFn: () => api<CrossProjectTasksResponse>("/api/tasks/upcoming"),
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
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: upcomingKey });
      const previous = queryClient.getQueryData<CrossProjectTasksResponse>(upcomingKey);
      queryClient.setQueryData<CrossProjectTasksResponse>(upcomingKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(upcomingKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: upcomingKey });
    },
  });

  const toggleStatus = async (projectId: string, taskId: string, status: string) => {
    await updateMutation.mutateAsync({ projectId, taskId, updates: { status } as TaskUpdates });
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
