import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Subtask } from "../types";

interface SubtaskResponse {
  subtask: Subtask;
}

interface TaskResponse {
  task: { subtasks: Subtask[] };
}

export function useSubtasks(projectId: string, taskId: string | null) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.tasks.detail(projectId, taskId ?? "");

  const createMutation = useMutation({
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

  const updateMutation = useMutation({
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

  const deleteMutation = useMutation({
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

  const reorderMutation = useMutation({
    mutationFn: (subtaskIds: string[]) =>
      api<{ subtasks: Subtask[] }>(`/api/projects/${projectId}/tasks/${taskId}/subtasks/reorder`, {
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
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });

  const createSubtask = async (title: string): Promise<Subtask> => {
    if (!taskId) throw new Error("No task selected");
    const data = await createMutation.mutateAsync(title);
    return data.subtask;
  };

  const updateSubtask = async (
    subtaskId: string,
    updates: Partial<Pick<Subtask, "title" | "completed">>,
  ): Promise<Subtask> => {
    if (!taskId) throw new Error("No task selected");
    const data = await updateMutation.mutateAsync({ subtaskId, updates });
    return data.subtask;
  };

  const deleteSubtask = async (subtaskId: string): Promise<void> => {
    if (!taskId) throw new Error("No task selected");
    await deleteMutation.mutateAsync(subtaskId);
  };

  const reorderSubtasks = async (subtaskIds: string[]): Promise<void> => {
    if (!taskId) throw new Error("No task selected");
    await reorderMutation.mutateAsync(subtaskIds);
  };

  return {
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
  };
}
