import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseApiError } from "~/platform/utils/api-error";
import type { CreateTaskData, Task, TaskStatus } from "../types";

export function useProjectTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      cursorRef.current = undefined;

      const response = await fetch(`/api/projects/${projectId}/tasks`);

      if (!response.ok) {
        await parseApiError(response, "Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data.tasks);
      setHasMore(data.hasMore ?? false);
      cursorRef.current = data.nextCursor;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const createTask = useCallback(
    async (data: CreateTaskData) => {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to create task");
      }

      const result = await response.json();
      setTasks((prev) => [...prev, result.task]);
      return result.task as Task;
    },
    [projectId],
  );

  const updateTask = useCallback(
    async (taskId: string, data: Partial<CreateTaskData> & { status?: TaskStatus }) => {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to update task");
      }

      const result = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? result.task : t)));
      return result.task as Task;
    },
    [projectId],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    [projectId],
  );

  const fetchMore = useCallback(async () => {
    if (!cursorRef.current) return;

    try {
      const params = new URLSearchParams();
      params.set("cursor", cursorRef.current);

      const response = await fetch(`/api/projects/${projectId}/tasks?${params}`);

      if (!response.ok) {
        await parseApiError(response, "Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks((prev) => [...prev, ...data.tasks]);
      setHasMore(data.hasMore ?? false);
      cursorRef.current = data.nextCursor;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [projectId]);

  return {
    tasks,
    loading,
    error,
    hasMore,
    fetchMore,
    tasksBySectionId,
    taskCountBySectionId,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
