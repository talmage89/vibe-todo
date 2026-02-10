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
    onSuccess: (data) => {
      queryClient.setQueryData<{ task: { subtasks: Subtask[] } }>(detailKey, (old) => {
        if (!old) return old;
        return { task: { ...old.task, subtasks: [...old.task.subtasks, data.subtask] } };
      });
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
    onSuccess: (data) => {
      queryClient.setQueryData<TaskResponse>(detailKey, (old) => {
        if (!old) return old;
        return {
          task: {
            ...old.task,
            subtasks: old.task.subtasks.map((s) => (s.id === data.subtask.id ? data.subtask : s)),
          },
        };
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (subtaskId: string) =>
      api<void>(`/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, subtaskId) => {
      queryClient.setQueryData<TaskResponse>(detailKey, (old) => {
        if (!old) return old;
        return {
          task: {
            ...old.task,
            subtasks: old.task.subtasks.filter((s) => s.id !== subtaskId),
          },
        };
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (subtaskIds: string[]) =>
      api<{ subtasks: Subtask[] }>(`/api/projects/${projectId}/tasks/${taskId}/subtasks/reorder`, {
        method: "POST",
        body: JSON.stringify({ subtaskIds }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<TaskResponse>(detailKey, (old) => {
        if (!old) return old;
        return { task: { ...old.task, subtasks: data.subtasks } };
      });
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
