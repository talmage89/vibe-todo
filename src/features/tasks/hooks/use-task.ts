import { useCallback, useEffect, useState } from "react";
import type { Prisma, TaskPriority, TaskStatus } from "~/platform/db/generated";

export type { TaskPriority, TaskStatus };

const taskSelect = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  priority: true,
  status: true,
  position: true,
  projectId: true,
  sectionId: true,
  createdAt: true,
  updatedAt: true,
  subtasks: {
    select: {
      id: true,
      title: true,
      completed: true,
      position: true,
      taskId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  tags: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
} satisfies Prisma.TaskSelect;

type PrismaTask = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

type SerializedDate<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K] extends Array<infer U>
        ? Array<SerializedDate<U>>
        : T[K];
};

export type Task = SerializedDate<PrismaTask>;
export type Subtask = Task["subtasks"][number];
export type Tag = Task["tags"][number];

export type TaskUpdates = Partial<
  Pick<Task, "title" | "description" | "dueDate" | "priority" | "status" | "sectionId">
> & {
  tagIds?: string[];
};

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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch task");
      }

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

      const data: TaskResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete task");
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

      const data: SubtaskResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to create subtask");
      }

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

      const data: SubtaskResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to update subtask");
      }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete subtask");
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

      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskIds }),
      });

      const data: { subtasks: Subtask[] } = await response.json();

      if (!response.ok) {
        throw new Error("Failed to reorder subtasks");
      }

      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: data.subtasks,
        };
      });
    },
    [projectId, taskId],
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
