import { useCallback, useState } from "react";
import type { Subtask } from "./use-tasks";

interface UseSubtasksOptions {
  projectId: string;
  taskId: string;
  initialSubtasks?: Subtask[];
}

export function useSubtasks({ projectId, taskId, initialSubtasks = [] }: UseSubtasksOptions) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = `/api/projects/${projectId}/tasks/${taskId}/subtasks`;

  const fetchSubtasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(baseUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch subtasks");
      }

      setSubtasks(data.subtasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const createSubtask = useCallback(
    async (title: string) => {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create subtask");
      }

      setSubtasks((prev) => [...prev, result.subtask]);
      return result.subtask;
    },
    [baseUrl],
  );

  const updateSubtask = useCallback(
    async (subtaskId: string, data: { title?: string; completed?: boolean }) => {
      const response = await fetch(`${baseUrl}/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update subtask");
      }

      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? result.subtask : s)));
      return result.subtask;
    },
    [baseUrl],
  );

  const deleteSubtask = useCallback(
    async (subtaskId: string) => {
      const response = await fetch(`${baseUrl}/${subtaskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete subtask");
      }

      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    },
    [baseUrl],
  );

  const reorderSubtasks = useCallback(
    async (subtaskIds: string[]) => {
      const response = await fetch(`${baseUrl}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reorder subtasks");
      }

      setSubtasks(result.subtasks);
    },
    [baseUrl],
  );

  const toggleSubtask = useCallback(
    async (subtaskId: string) => {
      const subtask = subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return;

      return updateSubtask(subtaskId, { completed: !subtask.completed });
    },
    [subtasks, updateSubtask],
  );

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;

  return {
    subtasks,
    loading,
    error,
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
    toggleSubtask,
    completedCount,
    totalCount,
    setSubtasks,
  };
}
