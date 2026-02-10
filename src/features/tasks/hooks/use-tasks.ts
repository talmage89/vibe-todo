import { useCallback, useEffect, useRef, useState } from "react";
import { parseApiError } from "~/platform/utils/api-error";
import type { CreateTaskData, Task } from "../types";

export function useTasks(projectId: string, sectionId?: string | null) {
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

      const params = new URLSearchParams();
      if (sectionId !== undefined) {
        params.set("sectionId", sectionId ?? "");
      }

      const url = `/api/projects/${projectId}/tasks${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url);

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
  }, [projectId, sectionId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchMore = useCallback(async () => {
    if (!cursorRef.current) return;

    try {
      const params = new URLSearchParams();
      if (sectionId !== undefined) {
        params.set("sectionId", sectionId ?? "");
      }
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
  }, [projectId, sectionId]);

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
    async (taskId: string, data: Partial<CreateTaskData>) => {
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

  const reorderTasks = useCallback(
    async (taskIds: string[], targetSectionId?: string | null) => {
      const response = await fetch(`/api/projects/${projectId}/tasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds, sectionId: targetSectionId }),
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to reorder tasks");
      }

      const result = await response.json();
      setTasks(result.tasks);
    },
    [projectId],
  );

  return {
    tasks,
    loading,
    error,
    hasMore,
    fetchMore,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refetch: fetchTasks,
  };
}
