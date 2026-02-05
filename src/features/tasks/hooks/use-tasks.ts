import { useCallback, useEffect, useState } from "react";
import type { TaskPriority, TaskStatus } from "~/platform/db/generated";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  position: number;
  sectionId: string | null;
  subtasks: Subtask[];
  tags: Tag[];
}

export interface CreateTaskData {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  status?: TaskStatus;
  sectionId?: string | null;
  tagIds?: string[];
}

export function useTasks(projectId: string, sectionId?: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (sectionId !== undefined) {
        params.set("sectionId", sectionId ?? "");
      }

      const url = `/api/projects/${projectId}/tasks${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url);
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
  }, [projectId, sectionId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
    async (taskId: string, data: Partial<CreateTaskData>) => {
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

  const reorderTasks = useCallback(
    async (taskIds: string[], targetSectionId?: string | null) => {
      const response = await fetch(`/api/projects/${projectId}/tasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds, sectionId: targetSectionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reorder tasks");
      }

      setTasks(result.tasks);
    },
    [projectId],
  );

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refetch: fetchTasks,
  };
}
