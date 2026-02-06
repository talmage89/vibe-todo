import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { type KeyboardEvent, type ReactNode, useCallback, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { Section } from "../hooks/use-sections";

interface SectionItemProps {
  section: Section;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdate: (name: string) => Promise<unknown>;
  onDelete: () => Promise<void>;
  taskCount?: number;
  children?: ReactNode;
}

export function SectionItem({
  section,
  isCollapsed,
  onToggleCollapse,
  onUpdate,
  onDelete,
  taskCount = 0,
  children,
}: SectionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditName(section.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [section.name]);

  const handleSaveEdit = useCallback(async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError("Section name is required");
      return;
    }

    if (trimmedName === section.name) {
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onUpdate(trimmedName);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update section");
    } finally {
      setLoading(false);
    }
  }, [editName, section.name, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditName(section.name);
    setError(null);
  }, [section.name]);

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
    try {
      setLoading(true);
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete section");
      setLoading(false);
    }
  }, [onDelete]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded border border-transparent",
        isDragging && "opacity-50",
        !isDragging && "hover:border-border",
      )}
    >
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-secondary opacity-0 transition-opacity hover:bg-surface hover:text-primary group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <Bars3Icon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded p-1 text-secondary transition-colors hover:bg-surface hover:text-primary"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expand section" : "Collapse section"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>

        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              disabled={loading}
              className="h-7 flex-1 text-sm"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex flex-1 items-center gap-2 text-left"
          >
            <span className="font-medium text-primary text-sm">{section.name}</span>
            {taskCount > 0 && <span className="text-secondary text-xs">{taskCount}</span>}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <EllipsisHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuItem onClick={handleStartEdit}>
              <PencilIcon className="h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-urgent">
              <TrashIcon className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error && <p className="px-2 pb-1.5 text-sm text-urgent">{error}</p>}

      {!isCollapsed && children}
    </div>
  );
}
