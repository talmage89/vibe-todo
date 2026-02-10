import { useCallback, useEffect, useState } from "react";
import { parseApiError } from "~/platform/utils/api-error";
import type { Subtask, Task, TaskUpdates } from "../types";

interface TaskResponse {
  task: Task;
}

interface SubtaskResponse {
  subtask: Subtask;
}

export function useTask(projectId: string, taskId: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`);

      if (!response.ok) {
        await parseApiError(response, "Failed to fetch task");
      }

      const data = await response.json();
      setTask(data.task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const updateTask = useCallback(
    async (updates: TaskUpdates): Promise<Task> => {
      if (!taskId) {
        throw new Error("No task selected");
      }

      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to update task");
      }

      const data: TaskResponse = await response.json();
      setTask(data.task);
      return data.task;
    },
    [projectId, taskId],
  );

  const deleteTask = useCallback(async () => {
    if (!taskId) {
      throw new Error("No task selected");
    }

    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      await parseApiError(response, "Failed to delete task");
    }

    setTask(null);
  }, [projectId, taskId]);

  const createSubtask = useCallback(
    async (title: string): Promise<Subtask> => {
      if (!taskId) {
        throw new Error("No task selected");
      }

      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to create subtask");
      }

      const data: SubtaskResponse = await response.json();

      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: [...prev.subtasks, data.subtask],
        };
      });

      return data.subtask;
    },
    [projectId, taskId],
  );

  const updateSubtask = useCallback(
    async (
      subtaskId: string,
      updates: Partial<Pick<Subtask, "title" | "completed">>,
    ): Promise<Subtask> => {
      if (!taskId) {
        throw new Error("No task selected");
      }

      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        },
      );

      if (!response.ok) {
        await parseApiError(response, "Failed to update subtask");
      }

      const data: SubtaskResponse = await response.json();

      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: prev.subtasks.map((s) => (s.id === subtaskId ? data.subtask : s)),
        };
      });

      return data.subtask;
    },
    [projectId, taskId],
  );

  const deleteSubtask = useCallback(
    async (subtaskId: string) => {
      if (!taskId) {
        throw new Error("No task selected");
      }

      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        await parseApiError(response, "Failed to delete subtask");
      }

      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: prev.subtasks.filter((s) => s.id !== subtaskId),
        };
      });
    },
    [projectId, taskId],
  );

  const reorderSubtasks = useCallback(
    async (subtaskIds: string[]) => {
      if (!taskId) {
        throw new Error("No task selected");
      }

      const previousTask = task;

      setTask((prev) => {
        if (!prev) return prev;
        const subtaskMap = new Map(prev.subtasks.map((s) => [s.id, s]));
        return {
          ...prev,
          subtasks: subtaskIds
            .map((id, index) => {
              const subtask = subtaskMap.get(id);
              if (!subtask) return null;
              return { ...subtask, position: index };
            })
            .filter((s): s is Subtask => s !== null),
        };
      });

      try {
        const response = await fetch(
          `/api/projects/${projectId}/tasks/${taskId}/subtasks/reorder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subtaskIds }),
          },
        );

        if (!response.ok) {
          await parseApiError(response, "Failed to reorder subtasks");
        }

        const data: { subtasks: Subtask[] } = await response.json();

        setTask((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            subtasks: data.subtasks,
          };
        });
      } catch (err) {
        setTask(previousTask);
        throw err;
      }
    },
    [projectId, taskId, task],
  );

  return {
    task,
    loading,
    error,
    updateTask,
    deleteTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
    refetch: fetchTask,
  };
}
