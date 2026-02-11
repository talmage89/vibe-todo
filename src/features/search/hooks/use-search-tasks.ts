import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskUpdates } from "~/features/tasks/types";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { SearchTasksResponse } from "../types";

interface TaskResponse {
  task: Task;
}

export function useSearchTasks(query: string) {
  const queryClient = useQueryClient();
  const searchKey = queryKeys.crossProjectTasks.search(query);

  const {
    data: tasks = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: searchKey,
    queryFn: () => api<SearchTasksResponse>(`/api/search?q=${encodeURIComponent(query)}`),
    select: (data) => data.results,
    enabled: query.length > 0,
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
      queryClient.invalidateQueries({ queryKey: searchKey });
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
