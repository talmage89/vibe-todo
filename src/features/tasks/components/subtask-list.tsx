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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, CheckIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/cn";
import { Input } from "~/components/ui/input";
import type { Subtask } from "../types";

interface SubtaskListProps {
  subtasks: Subtask[];
  onCreateSubtask: (title: string) => Promise<Subtask>;
  onUpdateSubtask: (
    subtaskId: string,
    updates: Partial<Pick<Subtask, "title" | "completed">>,
  ) => Promise<Subtask>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
  onReorderSubtasks: (subtaskIds: string[]) => Promise<void>;
}

export function SubtaskList({
  subtasks,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
}: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleCreate = useCallback(async () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    try {
      setCreating(true);
      await onCreateSubtask(trimmed);
      setNewSubtaskTitle("");
      inputRef.current?.focus();
    } finally {
      setCreating(false);
    }
  }, [newSubtaskTitle, onCreateSubtask]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreate();
      }
    },
    [handleCreate],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = subtasks.findIndex((s) => s.id === active.id);
        const newIndex = subtasks.findIndex((s) => s.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = [...subtasks];
        const [removed] = newOrder.splice(oldIndex, 1);
        if (!removed) return;
        newOrder.splice(newIndex, 0, removed);

        await onReorderSubtasks(newOrder.map((s) => s.id));
      }
    },
    [subtasks, onReorderSubtasks],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-medium text-secondary text-xs">
          Subtasks
          {totalCount > 0 && (
            <span className="ml-1.5 text-secondary">
              ({completedCount}/{totalCount})
            </span>
          )}
        </label>
      </div>

      {subtasks.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onUpdate={(updates) => onUpdateSubtask(subtask.id, updates)}
                  onDelete={() => onDeleteSubtask(subtask.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a subtask..."
          disabled={creating}
          className="h-8 flex-1 text-sm"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCreate}
          disabled={creating || !newSubtaskTitle.trim()}
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

interface SubtaskItemProps {
  subtask: Subtask;
  onUpdate: (updates: Partial<Pick<Subtask, "title" | "completed">>) => Promise<Subtask>;
  onDelete: () => Promise<void>;
}

function SubtaskItem({ subtask, onUpdate, onDelete }: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    setEditTitle(subtask.title);
  }, [subtask.title]);

  const handleToggle = useCallback(async () => {
    await onUpdate({ completed: !subtask.completed });
  }, [subtask.completed, onUpdate]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditTitle(subtask.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [subtask.title]);

  const handleSaveTitle = useCallback(async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === subtask.title) {
      setIsEditing(false);
      setEditTitle(subtask.title);
      return;
    }

    try {
      setSaving(true);
      await onUpdate({ title: trimmed });
      setIsEditing(false);
    } catch {
      setEditTitle(subtask.title);
    } finally {
      setSaving(false);
    }
  }, [editTitle, subtask.title, onUpdate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveTitle();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditTitle(subtask.title);
      }
    },
    [handleSaveTitle, subtask.title],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded px-2 py-1",
        isDragging ? "opacity-50" : "hover:bg-surface",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-secondary opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          subtask.completed
            ? "border-accent bg-accent text-white"
            : "border-border bg-background hover:border-accent",
        )}
      >
        {subtask.completed && <CheckIcon className="h-3 w-3" />}
      </button>

      {isEditing ? (
        <Input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveTitle}
          disabled={saving}
          className="h-6 flex-1 px-1 py-0 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={handleStartEdit}
          className={cn(
            "flex-1 text-left text-sm transition-colors",
            subtask.completed ? "text-secondary line-through" : "text-primary",
          )}
        >
          {subtask.title}
        </button>
      )}

      <Button
        variant="secondary"
        size="icon"
        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onDelete}
      >
        <TrashIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}
