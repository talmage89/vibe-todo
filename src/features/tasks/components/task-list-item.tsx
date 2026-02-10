import {
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronUpDownIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { Tag, Task, TaskUpdates } from "../types";
import { TaskPriority, TaskStatus } from "../types";
import { TagChip } from "./tag-chip";

interface TaskListItemProps {
  task: Task;
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onUpdateTask: (taskId: string, updates: TaskUpdates) => Promise<unknown>;
  onClick: (taskId: string) => void;
  availableTags?: Tag[];
}

const PRIORITY_COLORS: Record<string, string> = {
  [TaskPriority.URGENT]: "text-urgent",
  [TaskPriority.HIGH]: "text-high",
  [TaskPriority.MEDIUM]: "text-medium",
  [TaskPriority.LOW]: "text-low",
};

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: TaskPriority.NONE, label: "No priority" },
  { value: TaskPriority.LOW, label: "Low" },
  { value: TaskPriority.MEDIUM, label: "Medium" },
  { value: TaskPriority.HIGH, label: "High" },
  { value: TaskPriority.URGENT, label: "Urgent" },
];

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueDateOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

export function TaskListItem({
  task,
  onToggleStatus,
  onUpdateTask,
  onClick,
  availableTags = [],
}: TaskListItemProps) {
  const [toggling, setToggling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [saving, setSaving] = useState(false);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDone = task.status === TaskStatus.DONE;
  const priorityColor = PRIORITY_COLORS[task.priority];
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const hasMenuOpen = priorityMenuOpen || tagMenuOpen;

  useEffect(() => {
    setEditValue(task.title);
  }, [task.title]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (toggling) return;
      try {
        setToggling(true);
        const newStatus = isDone ? TaskStatus.TODO : TaskStatus.DONE;
        await onToggleStatus(task.id, newStatus);
      } finally {
        setToggling(false);
      }
    },
    [task.id, isDone, onToggleStatus, toggling],
  );

  const handleStartEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(task.title);
      setTimeout(() => inputRef.current?.select(), 0);
    },
    [task.title],
  );

  const handleSaveTitle = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === task.title) {
      setIsEditing(false);
      setEditValue(task.title);
      return;
    }
    try {
      setSaving(true);
      await onUpdateTask(task.id, { title: trimmed });
      setIsEditing(false);
    } catch {
      setEditValue(task.title);
    } finally {
      setSaving(false);
    }
  }, [editValue, task.id, task.title, onUpdateTask]);

  const handleTitleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveTitle();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(task.title);
      }
    },
    [handleSaveTitle, task.title],
  );

  const handlePriorityChange = useCallback(
    (value: string) => {
      onUpdateTask(task.id, { priority: value as TaskPriority });
    },
    [task.id, onUpdateTask],
  );

  const handleDueDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const newValue = e.target.value || null;
      onUpdateTask(task.id, { dueDate: newValue });
    },
    [task.id, onUpdateTask],
  );

  const handleToggleTag = useCallback(
    (tagId: string) => {
      const currentTagIds = task.tags.map((t) => t.id);
      const isSelected = currentTagIds.includes(tagId);
      const newTagIds = isSelected
        ? currentTagIds.filter((id) => id !== tagId)
        : [...currentTagIds, tagId];
      onUpdateTask(task.id, { tagIds: newTagIds });
    },
    [task.id, task.tags, onUpdateTask],
  );

  const dueDateInputValue = task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "";

  return (
    <div
      className={cn(
        "group/task flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface",
        hasMenuOpen && "bg-surface",
      )}
    >
      <span
        role="checkbox"
        aria-checked={isDone}
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle(e as unknown as React.MouseEvent);
          }
        }}
        className={cn(
          "flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
          isDone ? "text-accent" : "text-secondary hover:text-primary",
          toggling && "opacity-50",
        )}
      >
        {isDone ? (
          <CheckCircleSolidIcon className="h-4 w-4" />
        ) : (
          <CheckCircleIcon className="h-4 w-4" />
        )}
      </span>

      {isEditing ? (
        <div className="min-w-0 flex-1">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleSaveTitle}
            disabled={saving}
            className="h-auto border-none bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      ) : (
        <span
          role="button"
          tabIndex={0}
          onClick={handleStartEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleStartEdit(e as unknown as React.MouseEvent);
            }
          }}
          className={cn(
            "min-w-0 flex-1 cursor-text truncate",
            isDone ? "text-secondary line-through" : "text-primary",
          )}
        >
          {task.title}
        </span>
      )}

      <span className="flex shrink-0 items-center gap-1">
        {task.tags.length > 0 && !isDone && (
          <span className="flex items-center gap-1">
            {task.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} className="leading-none" />
            ))}
          </span>
        )}

        {totalSubtasks > 0 && (
          <span className="text-secondary text-xs">
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs",
              hasMenuOpen && "hidden",
              !hasMenuOpen && "group-hover/task:hidden",
              isDone
                ? "text-secondary"
                : isDueDateOverdue(task.dueDate)
                  ? "text-urgent"
                  : "text-secondary",
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {formatDueDate(task.dueDate)}
          </span>
        )}

        {priorityColor && !isDone && (
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full bg-current",
              hasMenuOpen && "hidden",
              !hasMenuOpen && "group-hover/task:hidden",
              priorityColor,
            )}
          />
        )}

        <span
          className={cn(
            "items-center gap-0.5",
            hasMenuOpen ? "flex" : "hidden group-hover/task:flex",
          )}
        >
          <div className="relative">
            <label
              className={cn(
                "flex h-6 w-6 cursor-pointer items-center justify-center rounded text-secondary transition-colors hover:bg-border hover:text-primary",
                task.dueDate && "text-accent",
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <input
                type="date"
                value={dueDateInputValue}
                onChange={handleDueDateChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                tabIndex={-1}
              />
            </label>
          </div>

          <DropdownMenu open={priorityMenuOpen} onOpenChange={setPriorityMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-secondary transition-colors hover:bg-border hover:text-primary",
                  task.priority !== TaskPriority.NONE && priorityColor,
                )}
              >
                <ChevronUpDownIcon className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={task.priority} onValueChange={handlePriorityChange}>
                {PRIORITY_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    <span className={cn("text-sm", PRIORITY_COLORS[option.value])}>
                      {option.label}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {availableTags.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setTagMenuOpen(!tagMenuOpen)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-secondary transition-colors hover:bg-border hover:text-primary",
                  task.tags.length > 0 && "text-accent",
                )}
              >
                <TagIcon className="h-3.5 w-3.5" />
              </button>
              {tagMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setTagMenuOpen(false)} />
                  <div className="absolute top-full right-0 z-50 mt-1 min-w-36 rounded-md border border-border bg-background p-1 shadow-sm">
                    {availableTags.map((tag) => {
                      const isSelected = task.tags.some((t) => t.id === tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleTag(tag.id)}
                          className="relative flex w-full items-center rounded py-1.5 pr-7 pl-2 text-sm transition-colors hover:bg-surface"
                        >
                          <span
                            className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-primary">{tag.name}</span>
                          {isSelected && (
                            <span className="absolute right-2 text-primary">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onClick(task.id)}
            className="flex h-6 w-6 items-center justify-center rounded text-secondary transition-colors hover:bg-border hover:text-primary"
            title="Open details"
          >
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </button>
        </span>
      </span>
    </div>
  );
}
