import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, TrashIcon } from "@heroicons/react/24/outline";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/components/ui/cn";
import { Input } from "~/components/ui/input";
import type { Subtask } from "../hooks/use-tasks";

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (subtaskId: string) => Promise<void>;
  onUpdate: (subtaskId: string, title: string) => Promise<void>;
  onDelete: (subtaskId: string) => Promise<void>;
  disabled?: boolean;
}

export function SubtaskItem({
  subtask,
  onToggle,
  onUpdate,
  onDelete,
  disabled = false,
}: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggle = useCallback(async () => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      await onToggle(subtask.id);
    } finally {
      setLoading(false);
    }
  }, [disabled, loading, onToggle, subtask.id]);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditTitle(subtask.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, subtask.title]);

  const handleSaveEdit = useCallback(async () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditTitle(subtask.title);
      setIsEditing(false);
      return;
    }

    if (trimmedTitle === subtask.title) {
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      await onUpdate(subtask.id, trimmedTitle);
      setIsEditing(false);
    } catch {
      setEditTitle(subtask.title);
    } finally {
      setLoading(false);
    }
  }, [editTitle, subtask.id, subtask.title, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditTitle(subtask.title);
  }, [subtask.title]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  const handleDelete = useCallback(async () => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      await onDelete(subtask.id);
    } catch {
      setLoading(false);
    }
  }, [disabled, loading, onDelete, subtask.id]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded px-1 py-1",
        isDragging && "opacity-50",
        !isDragging && "hover:bg-surface",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-secondary opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label="Drag to reorder"
      >
        <Bars3Icon className="h-3.5 w-3.5" />
      </button>

      <Checkbox
        checked={subtask.completed}
        onCheckedChange={handleToggle}
        disabled={disabled || loading}
        aria-label={subtask.completed ? "Mark as incomplete" : "Mark as complete"}
      />

      {isEditing ? (
        <Input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          disabled={loading}
          className="h-6 flex-1 px-1 py-0 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={handleStartEdit}
          disabled={disabled}
          className={cn(
            "flex-1 text-left text-sm transition-colors",
            subtask.completed ? "text-secondary line-through" : "text-primary",
          )}
        >
          {subtask.title}
        </button>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled || loading}
        className="rounded p-0.5 text-secondary opacity-0 transition-opacity hover:text-urgent group-hover:opacity-100"
        aria-label="Delete subtask"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
