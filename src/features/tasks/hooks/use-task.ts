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
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: allTasksKey });
      const previousDetail = queryClient.getQueryData<TaskResponse>(detailKey);
      const previousList = queryClient.getQueryData(allTasksKey);
      queryClient.setQueryData<TaskResponse>(detailKey, (old) => {
        if (!old) return old;
        return { task: { ...old.task, ...updates } };
      });
      queryClient.setQueryData<{ tasks: Task[] }>(allTasksKey, (old) => {
        if (!old) return old;
        return {
          tasks: old.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
        };
      });
      return { previousDetail, previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) queryClient.setQueryData(detailKey, context.previousDetail);
      if (context?.previousList) queryClient.setQueryData(allTasksKey, context.previousList);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api<void>(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: allTasksKey });
      const previousList = queryClient.getQueryData(allTasksKey);
      queryClient.setQueryData<{ tasks: Task[] }>(allTasksKey, (old) => {
        if (!old) return old;
        return { tasks: old.tasks.filter((t) => t.id !== taskId) };
      });
      queryClient.removeQueries({ queryKey: detailKey });
      return { previousList };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) queryClient.setQueryData(allTasksKey, context.previousList);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) =>
      api<SubtaskResponse>(`/api/projects/${projectId}/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<TaskResponse>(detailKey);
      queryClient.setQueryData<TaskResponse>(detailKey, (old) => {
        if (!old) return old;
        const optimistic: Subtask = {
          id: `temp-${crypto.randomUUID()}`,
          title,
          completed: false,
          position: old.task.subtasks.length,
          taskId: taskId ?? "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { task: { ...old.task, subtasks: [...old.task.subtasks, optimistic] } };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
    onSettled: () => {
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
    onMutate: async ({ subtaskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<TaskResponse>(detailKey);
      queryClient.setQueryData<TaskResponse>(detailKey, (old) => {
        if (!old) return old;
        return {
          task: {
            ...old.task,
            subtasks: old.task.subtasks.map((s) => (s.id === subtaskId ? { ...s, ...updates } : s)),
          },
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) =>
      api<void>(`/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "DELETE",
      }),
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<TaskResponse>(detailKey);
      queryClient.setQueryData<TaskResponse>(detailKey, (old) => {
        if (!old) return old;
        return {
          task: {
            ...old.task,
            subtasks: old.task.subtasks.filter((s) => s.id !== subtaskId),
          },
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
    onSettled: () => {
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
