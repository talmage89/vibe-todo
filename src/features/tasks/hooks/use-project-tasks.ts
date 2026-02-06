import { useCallback, useEffect, useMemo, useState } from "react";
import type { CreateTaskData, Task, TaskStatus } from "../types";

export function useProjectTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/tasks`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tasks");
      }

      setTasks(data.tasks);
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create task");
      }

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update task");
      }

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
        const result = await response.json();
        throw new Error(result.error || "Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    [projectId],
  );

  return {
    tasks,
    loading,
    error,
    tasksBySectionId,
    taskCountBySectionId,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
