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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<TasksResponse>(tasksKey);
      queryClient.setQueryData<TasksResponse>(tasksKey, (old) => {
        if (!old) return old;
        const now = new Date().toISOString();
        const optimistic: Task = {
          id: `temp-${crypto.randomUUID()}`,
          title: data.title,
          description: data.description ?? null,
          dueDate: data.dueDate?.toISOString() ?? null,
          priority: data.priority ?? "NONE",
          status: data.status ?? "TODO",
          position: old.tasks.length,
          projectId,
          sectionId: data.sectionId ?? null,
          createdAt: now,
          updatedAt: now,
          subtasks: [],
          tags: [],
        };
        return { tasks: [...old.tasks, optimistic] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<CreateTaskData> }) =>
      api<TaskResponse>(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<TasksResponse>(tasksKey);
      const { dueDate, tagIds, ...fields } = data;
      queryClient.setQueryData<TasksResponse>(tasksKey, (old) => {
        if (!old) return old;
        return {
          tasks: old.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  ...fields,
                  ...(dueDate !== undefined && { dueDate: dueDate.toISOString() }),
                }
              : t,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) =>
      api<void>(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<TasksResponse>(tasksKey);
      queryClient.setQueryData<TasksResponse>(tasksKey, (old) => {
        if (!old) return old;
        return { tasks: old.tasks.filter((t) => t.id !== taskId) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey, context.previous);
    },
    onSettled: () => {
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
    onMutate: async ({ taskIds, targetSectionId }) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<TasksResponse>(tasksKey);
      queryClient.setQueryData<TasksResponse>(tasksKey, (old) => {
        if (!old) return old;
        const updated = old.tasks.map((t) => {
          const orderIndex = taskIds.indexOf(t.id);
          if (orderIndex !== -1) {
            return {
              ...t,
              position: orderIndex,
              sectionId: targetSectionId === undefined ? t.sectionId : targetSectionId,
            };
          }
          return t;
        });
        return { tasks: updated };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tasksKey, context.previous);
    },
    onSettled: () => {
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
