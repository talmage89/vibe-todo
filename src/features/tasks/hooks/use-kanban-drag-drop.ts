import {
  type CollisionDetection,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Task } from "../types";
import { type TaskStatus, TaskStatus as TaskStatusEnum } from "../types";

const ALL_STATUSES: TaskStatus[] = [
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
];

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const map = {} as Record<TaskStatus, Task[]>;
  for (const s of ALL_STATUSES) map[s] = [];
  for (const task of tasks) {
    map[task.status]?.push(task);
  }
  return map;
}

function findColumnForTask(taskId: string, columns: Record<TaskStatus, Task[]>): TaskStatus | null {
  for (const status of ALL_STATUSES) {
    if (columns[status].some((t) => t.id === taskId)) return status;
  }
  return null;
}

interface UseKanbanDragDropArgs {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

export function useKanbanDragDrop({ tasks, onUpdateTaskStatus }: UseKanbanDragDropArgs) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState<Record<TaskStatus, Task[]> | null>(null);
  const sourceColumnRef = useRef<TaskStatus | null>(null);

  const serverColumns = useMemo(() => groupByStatus(tasks), [tasks]);
  const columns = localColumns ?? serverColumns;

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    for (const status of ALL_STATUSES) {
      const task = columns[status].find((t) => t.id === activeId);
      if (task) return task;
    }
    return null;
  }, [activeId, columns]);

  const collisionDetection: CollisionDetection = useCallback((args) => {
    return closestCorners(args);
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveId(id);
      sourceColumnRef.current = findColumnForTask(id, localColumns ?? serverColumns);
    },
    [localColumns, serverColumns],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeTaskId = String(active.id);
      const overId = String(over.id);

      const currentCols = localColumns ?? serverColumns;
      const activeColumn = findColumnForTask(activeTaskId, currentCols);
      if (!activeColumn) return;

      let overColumn: TaskStatus | null = null;
      if (ALL_STATUSES.includes(overId as TaskStatus)) {
        overColumn = overId as TaskStatus;
      } else {
        overColumn = findColumnForTask(overId, currentCols);
      }

      if (!overColumn || activeColumn === overColumn) return;

      const newCols = { ...currentCols };
      const sourceArr = [...newCols[activeColumn]];
      const destArr = [...newCols[overColumn]];

      const taskIndex = sourceArr.findIndex((t) => t.id === activeTaskId);
      if (taskIndex === -1) return;

      const [removed] = sourceArr.splice(taskIndex, 1);
      if (!removed) return;

      if (ALL_STATUSES.includes(overId as TaskStatus)) {
        destArr.push(removed);
      } else {
        const overIndex = destArr.findIndex((t) => t.id === overId);
        if (overIndex !== -1) {
          destArr.splice(overIndex, 0, removed);
        } else {
          destArr.push(removed);
        }
      }

      newCols[activeColumn] = sourceArr;
      newCols[overColumn] = destArr;
      setLocalColumns(newCols);
    },
    [localColumns, serverColumns],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        setActiveId(null);
        setLocalColumns(null);
        sourceColumnRef.current = null;
        return;
      }

      const activeTaskId = String(active.id);
      const overId = String(over.id);
      const currentCols = localColumns ?? serverColumns;
      const activeColumn = findColumnForTask(activeTaskId, currentCols);

      if (!activeColumn) {
        setActiveId(null);
        setLocalColumns(null);
        sourceColumnRef.current = null;
        return;
      }

      if (!ALL_STATUSES.includes(overId as TaskStatus) && activeTaskId !== overId) {
        const overColumn = findColumnForTask(overId, currentCols);
        if (overColumn && overColumn === activeColumn) {
          const colTasks = [...currentCols[activeColumn]];
          const oldIdx = colTasks.findIndex((t) => t.id === activeTaskId);
          const newIdx = colTasks.findIndex((t) => t.id === overId);
          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
            const reordered = arrayMove(colTasks, oldIdx, newIdx);
            const newCols = { ...currentCols };
            newCols[activeColumn] = reordered;
            setLocalColumns(newCols);
          }
        }
      }

      const sourceColumn = sourceColumnRef.current;
      const finalColumn = findColumnForTask(activeTaskId, localColumns ?? serverColumns);

      if (sourceColumn && finalColumn && sourceColumn !== finalColumn) {
        await onUpdateTaskStatus(activeTaskId, finalColumn);
      }

      setActiveId(null);
      setLocalColumns(null);
      sourceColumnRef.current = null;
    },
    [localColumns, serverColumns, onUpdateTaskStatus],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setLocalColumns(null);
    sourceColumnRef.current = null;
  }, []);

  return {
    activeId,
    activeTask,
    columns,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
