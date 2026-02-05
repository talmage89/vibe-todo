import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback } from "react";
import { cn } from "~/components/ui/cn";
import type { Subtask } from "../hooks/use-tasks";
import { SubtaskItem } from "./subtask-item";
import { SubtaskQuickAdd } from "./subtask-quick-add";

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (subtaskId: string) => Promise<void>;
  onUpdate: (subtaskId: string, title: string) => Promise<void>;
  onDelete: (subtaskId: string) => Promise<void>;
  onReorder: (subtaskIds: string[]) => Promise<void>;
  onAdd: (title: string) => Promise<void>;
  disabled?: boolean;
  showProgress?: boolean;
}

export function SubtaskList({
  subtasks,
  onToggle,
  onUpdate,
  onDelete,
  onReorder,
  onAdd,
  disabled = false,
  showProgress = true,
}: SubtaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = subtasks.findIndex((s) => s.id === active.id);
        const newIndex = subtasks.findIndex((s) => s.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = [...subtasks];
        const removed = newOrder.splice(oldIndex, 1)[0];
        if (!removed) return;
        newOrder.splice(newIndex, 0, removed);

        await onReorder(newOrder.map((s) => s.id));
      }
    },
    [subtasks, onReorder],
  );

  return (
    <div className="space-y-1">
      {showProgress && totalCount > 0 && (
        <div className="flex items-center gap-2 px-1 pb-1">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completedCount === totalCount ? "bg-accent" : "bg-secondary",
              )}
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <span className="text-secondary text-xs">
            {completedCount}/{totalCount}
          </span>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              disabled={disabled}
            />
          ))}
        </SortableContext>
      </DndContext>

      <SubtaskQuickAdd onAdd={onAdd} disabled={disabled} />
    </div>
  );
}
