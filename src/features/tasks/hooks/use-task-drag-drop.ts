import {
  type CollisionDetection,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Task } from "../types";

export function toSectionSortId(id: string) {
  return `section-${id}`;
}

export function toTaskSortId(id: string) {
  return `task-${id}`;
}

function parseSortId(sortId: string): { type: "section" | "task"; id: string } {
  const str = String(sortId);
  if (str.startsWith("section-")) return { type: "section", id: str.slice(8) };
  return { type: "task", id: str.slice(5) };
}

function findSectionForTask(taskId: string, map: Record<string, Task[]>): string | null {
  for (const [sectionKey, tasks] of Object.entries(map)) {
    if (tasks.some((t) => t.id === taskId)) return sectionKey;
  }
  return null;
}

function cloneTaskMap(map: Record<string, Task[]>): Record<string, Task[]> {
  const clone: Record<string, Task[]> = {};
  for (const [key, tasks] of Object.entries(map)) {
    clone[key] = [...tasks];
  }
  return clone;
}

interface UseTaskDragDropArgs {
  tasksBySectionId: Record<string, Task[]>;
  sections: { id: string }[];
  onReorderSections: (sectionIds: string[]) => Promise<void>;
  onReorderTasks: (taskIds: string[], sectionId?: string | null) => Promise<void>;
}

export function useTaskDragDrop({
  tasksBySectionId,
  sections,
  onReorderSections,
  onReorderTasks,
}: UseTaskDragDropArgs) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTaskMap, setLocalTaskMap] = useState<Record<string, Task[]> | null>(null);

  const activeTypeRef = useRef<"section" | "task" | null>(null);
  const currentTaskMap = localTaskMap ?? tasksBySectionId;

  const activeTask = useMemo(() => {
    if (!activeId || activeTypeRef.current !== "task") return null;
    const parsed = parseSortId(activeId);
    for (const tasks of Object.values(currentTaskMap)) {
      const task = tasks.find((t) => t.id === parsed.id);
      if (task) return task;
    }
    return null;
  }, [activeId, currentTaskMap]);

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const type = activeTypeRef.current;
    if (type === "section") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) =>
          String(c.id).startsWith("section-"),
        ),
      });
    }
    if (type === "task") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => !String(c.id).startsWith("section-"),
        ),
      });
    }
    return closestCenter(args);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const parsed = parseSortId(String(event.active.id));
    activeTypeRef.current = parsed.type;
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || activeTypeRef.current !== "task") return;

      const activeParsed = parseSortId(String(active.id));
      const overId = String(over.id);

      if (activeParsed.type !== "task") return;

      const map = localTaskMap ?? tasksBySectionId;
      const activeSection = findSectionForTask(activeParsed.id, map);
      if (!activeSection) return;

      let targetSection: string | null = null;
      if (overId.startsWith("task-")) {
        const overParsed = parseSortId(overId);
        targetSection = findSectionForTask(overParsed.id, map);
      } else {
        targetSection = overId;
      }

      if (!targetSection || activeSection === targetSection) return;

      const newMap = cloneTaskMap(map);
      const sourceTasks = newMap[activeSection] ?? [];
      const destTasks = newMap[targetSection] ?? [];

      const taskIndex = sourceTasks.findIndex((t) => t.id === activeParsed.id);
      if (taskIndex === -1) return;

      const removed = sourceTasks.splice(taskIndex, 1)[0];
      if (!removed) return;

      if (overId.startsWith("task-")) {
        const overTaskId = parseSortId(overId).id;
        const overIndex = destTasks.findIndex((t) => t.id === overTaskId);
        if (overIndex !== -1) {
          destTasks.splice(overIndex, 0, removed);
        } else {
          destTasks.push(removed);
        }
      } else {
        destTasks.push(removed);
      }

      newMap[activeSection] = sourceTasks;
      newMap[targetSection] = destTasks;
      setLocalTaskMap(newMap);
    },
    [localTaskMap, tasksBySectionId],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const type = activeTypeRef.current;

      if (!over || active.id === over.id) {
        setActiveId(null);
        activeTypeRef.current = null;
        setLocalTaskMap(null);
        return;
      }

      const activeParsed = parseSortId(String(active.id));
      const overParsed = parseSortId(String(over.id));

      if (type === "section" && overParsed.type === "section") {
        const oldIdx = sections.findIndex((s) => s.id === activeParsed.id);
        const newIdx = sections.findIndex((s) => s.id === overParsed.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          const newOrder = [...sections];
          const [removed] = newOrder.splice(oldIdx, 1);
          if (removed) {
            newOrder.splice(newIdx, 0, removed);
            await onReorderSections(newOrder.map((s) => s.id));
          }
        }
      } else if (type === "task") {
        const map = localTaskMap ?? tasksBySectionId;
        const sectionKey = findSectionForTask(activeParsed.id, map);

        if (sectionKey) {
          const sectionTasks = [...(map[sectionKey] ?? [])];
          const sectionId = sectionKey === "__unsectioned" ? null : sectionKey;

          if (overParsed.type === "task") {
            const oldIdx = sectionTasks.findIndex((t) => t.id === activeParsed.id);
            const newIdx = sectionTasks.findIndex((t) => t.id === overParsed.id);
            if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
              const [removed] = sectionTasks.splice(oldIdx, 1);
              if (removed) {
                sectionTasks.splice(newIdx, 0, removed);
              }
            }
            await onReorderTasks(
              sectionTasks.map((t) => t.id),
              sectionId,
            );
          } else {
            await onReorderTasks(
              sectionTasks.map((t) => t.id),
              sectionId,
            );
          }
        }
      }

      setActiveId(null);
      activeTypeRef.current = null;
      setLocalTaskMap(null);
    },
    [sections, onReorderSections, localTaskMap, tasksBySectionId, onReorderTasks],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    activeTypeRef.current = null;
    setLocalTaskMap(null);
  }, []);

  return {
    activeId,
    activeTask,
    currentTaskMap,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
