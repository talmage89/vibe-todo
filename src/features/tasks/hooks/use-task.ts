import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Subtask, Task, TaskUpdates } from "../types";

interface TaskResponse {
  task: Task;
}

interface SubtaskResponse {
  subtask: Subtask;
}

interface SubtasksResponse {
  subtasks: Subtask[];
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

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) =>
      api<SubtaskResponse>(`/api/projects/${projectId}/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({
      subtaskId,
      updates,
    }: {
      subtaskId: string;
      updates: Partial<Pick<Subtask, "title" | "completed">>;
    }) =>
      api<SubtaskResponse>(`/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) =>
      api<void>(`/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });

  const reorderSubtasksMutation = useMutation({
    mutationFn: (subtaskIds: string[]) =>
      api<SubtasksResponse>(`/api/projects/${projectId}/tasks/${taskId}/subtasks/reorder`, {
        method: "POST",
        body: JSON.stringify({ subtaskIds }),
      }),
    onMutate: async (subtaskIds) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<TaskResponse>(detailKey);
      queryClient.setQueryData<TaskResponse>(detailKey, (old) => {
        if (!old) return old;
        const subtaskMap = new Map(old.task.subtasks.map((s) => [s.id, s]));
        const reordered = subtaskIds
          .map((id, index) => {
            const subtask = subtaskMap.get(id);
            if (!subtask) return null;
            return { ...subtask, position: index };
          })
          .filter((s): s is Subtask => s !== null);
        return { task: { ...old.task, subtasks: reordered } };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
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

  const createSubtask = async (title: string): Promise<Subtask> => {
    if (!taskId) throw new Error("No task selected");
    const data = await createSubtaskMutation.mutateAsync(title);
    return data.subtask;
  };

  const updateSubtask = async (
    subtaskId: string,
    updates: Partial<Pick<Subtask, "title" | "completed">>,
  ): Promise<Subtask> => {
    if (!taskId) throw new Error("No task selected");
    const data = await updateSubtaskMutation.mutateAsync({ subtaskId, updates });
    return data.subtask;
  };

  const deleteSubtask = async (subtaskId: string): Promise<void> => {
    if (!taskId) throw new Error("No task selected");
    await deleteSubtaskMutation.mutateAsync(subtaskId);
  };

  const reorderSubtasks = async (subtaskIds: string[]): Promise<void> => {
    if (!taskId) throw new Error("No task selected");
    await reorderSubtasksMutation.mutateAsync(subtaskIds);
  };

  return {
    task,
    loading,
    error: queryError?.message ?? null,
    updateTask,
    deleteTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
  };
}
