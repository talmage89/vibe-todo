import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { CreateTaskData, Task } from "../types";

interface TasksResponse {
  tasks: Task[];
}

interface TaskResponse {
  task: Task;
}

export function useTasks(projectId: string, sectionId?: string | null) {
  const queryClient = useQueryClient();
  const tasksKey = queryKeys.tasks.list(projectId, { sectionId });
  const allTasksKey = queryKeys.tasks.all(projectId);

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (sectionId !== undefined) {
      params.set("sectionId", sectionId ?? "");
    }
    return `/api/projects/${projectId}/tasks${params.toString() ? `?${params}` : ""}`;
  };

  const {
    data: tasks = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: tasksKey,
    queryFn: () => api<TasksResponse>(buildUrl()),
    select: (data) => data.tasks,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskData) =>
      api<TaskResponse>(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<CreateTaskData> }) =>
      api<TaskResponse>(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) =>
      api<void>(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({
      taskIds,
      targetSectionId,
    }: {
      taskIds: string[];
      targetSectionId?: string | null;
    }) =>
      api<TasksResponse>(`/api/projects/${projectId}/tasks/reorder`, {
        method: "POST",
        body: JSON.stringify({ taskIds, sectionId: targetSectionId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const createTask = async (data: CreateTaskData): Promise<Task> => {
    const result = await createMutation.mutateAsync(data);
    return result.task;
  };

  const updateTask = async (taskId: string, data: Partial<CreateTaskData>): Promise<Task> => {
    const result = await updateMutation.mutateAsync({ taskId, data });
    return result.task;
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await deleteMutation.mutateAsync(taskId);
  };

  const reorderTasks = async (
    taskIds: string[],
    targetSectionId?: string | null,
  ): Promise<void> => {
    await reorderMutation.mutateAsync({ taskIds, targetSectionId });
  };

  return {
    tasks,
    loading,
    error: queryError?.message ?? null,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
}
