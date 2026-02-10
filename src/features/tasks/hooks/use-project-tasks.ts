import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { CreateTaskData, Task, TaskStatus } from "../types";

interface TasksResponse {
  tasks: Task[];
}

interface TaskResponse {
  task: Task;
}

export function useProjectTasks(projectId: string) {
  const queryClient = useQueryClient();
  const allTasksKey = queryKeys.tasks.all(projectId);

  const {
    data: tasks = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: allTasksKey,
    queryFn: () => api<TasksResponse>(`/api/projects/${projectId}/tasks`),
    select: (data) => data.tasks,
  });

  const tasksBySectionId = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      const key = task.sectionId ?? "__unsectioned";
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const taskCountBySectionId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      if (task.sectionId) {
        counts[task.sectionId] = (counts[task.sectionId] ?? 0) + 1;
      }
    }
    return counts;
  }, [tasks]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskData) =>
      api<TaskResponse>(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: allTasksKey });
      const previous = queryClient.getQueryData<TasksResponse>(allTasksKey);
      queryClient.setQueryData<TasksResponse>(allTasksKey, (old) => {
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
      if (context?.previous) queryClient.setQueryData(allTasksKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: Partial<CreateTaskData> & { status?: TaskStatus };
    }) =>
      api<TaskResponse>(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: allTasksKey });
      const previous = queryClient.getQueryData<TasksResponse>(allTasksKey);
      const { dueDate, tagIds, ...fields } = data;
      queryClient.setQueryData<TasksResponse>(allTasksKey, (old) => {
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
      if (context?.previous) queryClient.setQueryData(allTasksKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) =>
      api<void>(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: allTasksKey });
      const previous = queryClient.getQueryData<TasksResponse>(allTasksKey);
      queryClient.setQueryData<TasksResponse>(allTasksKey, (old) => {
        if (!old) return old;
        return { tasks: old.tasks.filter((t) => t.id !== taskId) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(allTasksKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ taskIds, sectionId }: { taskIds: string[]; sectionId?: string | null }) =>
      api<TasksResponse>(`/api/projects/${projectId}/tasks/reorder`, {
        method: "POST",
        body: JSON.stringify({ taskIds, sectionId }),
      }),
    onMutate: async ({ taskIds, sectionId }) => {
      await queryClient.cancelQueries({ queryKey: allTasksKey });
      const previous = queryClient.getQueryData<TasksResponse>(allTasksKey);
      queryClient.setQueryData<TasksResponse>(allTasksKey, (old) => {
        if (!old) return old;
        const updated = old.tasks.map((t) => {
          const orderIndex = taskIds.indexOf(t.id);
          if (orderIndex !== -1) {
            return {
              ...t,
              position: orderIndex,
              sectionId: sectionId === undefined ? t.sectionId : sectionId,
            };
          }
          return t;
        });
        return { tasks: updated };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(allTasksKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: allTasksKey });
    },
  });

  const createTask = async (data: CreateTaskData): Promise<Task> => {
    const result = await createMutation.mutateAsync(data);
    return result.task;
  };

  const updateTask = async (
    taskId: string,
    data: Partial<CreateTaskData> & { status?: TaskStatus },
  ): Promise<Task> => {
    const result = await updateMutation.mutateAsync({ taskId, data });
    return result.task;
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await deleteMutation.mutateAsync(taskId);
  };

  const reorderTasks = async (taskIds: string[], sectionId?: string | null): Promise<void> => {
    await reorderMutation.mutateAsync({ taskIds, sectionId });
  };

  return {
    tasks,
    loading,
    error: queryError?.message ?? null,
    tasksBySectionId,
    taskCountBySectionId,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
}
