import { closestCenter, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useCallback, useMemo, useState } from "react";
import type { Task } from "../types";

export function toTaskSortId(id: string) {
  return `task-${id}`;
}

function parseTaskId(sortId: string): string {
  return String(sortId).slice(5);
}

interface UseTaskDragDropArgs {
  tasks: Task[];
  onReorderTasks: (taskIds: string[]) => Promise<void>;
}

export function useTaskDragDrop({ tasks, onReorderTasks }: UseTaskDragDropArgs) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    const id = parseTaskId(activeId);
    return tasks.find((t) => t.id === id) ?? null;
  }, [activeId, tasks]);

  const collisionDetection = closestCenter;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);

      if (!over || active.id === over.id) return;

      const activeTaskId = parseTaskId(String(active.id));
      const overTaskId = parseTaskId(String(over.id));

      const oldIdx = tasks.findIndex((t) => t.id === activeTaskId);
      const newIdx = tasks.findIndex((t) => t.id === overTaskId);

      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

      const reordered = [...tasks];
      const [removed] = reordered.splice(oldIdx, 1);
      if (removed) {
        reordered.splice(newIdx, 0, removed);
      }

      await onReorderTasks(reordered.map((t) => t.id));
    },
    [tasks, onReorderTasks],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return {
    activeTask,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
