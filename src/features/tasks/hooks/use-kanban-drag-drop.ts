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

function isStatusId(id: string): id is TaskStatus {
  return ALL_STATUSES.includes(id as TaskStatus);
}

function findColumnForTask(taskId: string, columns: Record<TaskStatus, Task[]>): TaskStatus | null {
  for (const status of ALL_STATUSES) {
    if (columns[status].some((t) => t.id === taskId)) return status;
  }
  return null;
}

function cloneColumns(cols: Record<TaskStatus, Task[]>): Record<TaskStatus, Task[]> {
  const clone = {} as Record<TaskStatus, Task[]>;
  for (const s of ALL_STATUSES) clone[s] = [...cols[s]];
  return clone;
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
      sourceColumnRef.current = findColumnForTask(id, serverColumns);
    },
    [serverColumns],
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

      const overColumn = isStatusId(overId) ? overId : findColumnForTask(overId, currentCols);
      if (!overColumn || activeColumn === overColumn) return;

      const newCols = cloneColumns(currentCols);
      const taskIndex = newCols[activeColumn].findIndex((t) => t.id === activeTaskId);
      if (taskIndex === -1) return;

      const [removed] = newCols[activeColumn].splice(taskIndex, 1);
      if (!removed) return;

      if (isStatusId(overId)) {
        newCols[overColumn].push(removed);
      } else {
        const overIndex = newCols[overColumn].findIndex((t) => t.id === overId);
        if (overIndex !== -1) {
          newCols[overColumn].splice(overIndex, 0, removed);
        } else {
          newCols[overColumn].push(removed);
        }
      }

      setLocalColumns(newCols);
    },
    [localColumns, serverColumns],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const sourceColumn = sourceColumnRef.current;

      setActiveId(null);
      sourceColumnRef.current = null;

      if (!over) {
        setLocalColumns(null);
        return;
      }

      const activeTaskId = String(active.id);
      const overId = String(over.id);
      const currentCols = localColumns ?? serverColumns;
      const activeColumn = findColumnForTask(activeTaskId, currentCols);

      if (!activeColumn) {
        setLocalColumns(null);
        return;
      }

      if (!isStatusId(overId) && activeTaskId !== overId) {
        const overColumn = findColumnForTask(overId, currentCols);
        if (overColumn && overColumn === activeColumn) {
          const colTasks = currentCols[activeColumn];
          const oldIdx = colTasks.findIndex((t) => t.id === activeTaskId);
          const newIdx = colTasks.findIndex((t) => t.id === overId);
          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
            const newCols = cloneColumns(currentCols);
            newCols[activeColumn] = arrayMove(colTasks, oldIdx, newIdx);
            setLocalColumns(newCols);
          }
        }
      }

      setLocalColumns(null);

      if (sourceColumn && activeColumn !== sourceColumn) {
        onUpdateTaskStatus(activeTaskId, activeColumn);
      }
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
