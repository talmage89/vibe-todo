import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Task, TaskUpdates } from "../types";

interface TaskResponse {
  task: Task;
}

export function useTask(projectId: string, taskId: string | null) {
  const queryClient = useQueryClient();
  const allTasksKey = queryKeys.tasks.all(projectId);
  const detailKey = queryKeys.tasks.detail(projectId, taskId ?? "");

  const {
    data: task = null,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: detailKey,
    queryFn: () => api<TaskResponse>(`/api/projects/${projectId}/tasks/${taskId}`),
    select: (data) => data.task,
    enabled: !!taskId,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: TaskUpdates) =>
      api<TaskResponse>(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<TaskResponse>(detailKey, data);
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api<void>(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: detailKey });
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const updateTask = async (updates: TaskUpdates): Promise<Task> => {
    if (!taskId) throw new Error("No task selected");
    const data = await updateMutation.mutateAsync(updates);
    return data.task;
  };

  const deleteTask = async (): Promise<void> => {
    if (!taskId) throw new Error("No task selected");
    await deleteMutation.mutateAsync();
  };

  return {
    task,
    loading,
    error: queryError?.message ?? null,
    updateTask,
    deleteTask,
  };
}
