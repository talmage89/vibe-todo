import { CalendarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { useCallback, useState } from "react";
import { cn } from "~/components/ui/cn";
import { TaskPriority, TaskStatus } from "~/platform/db/generated";
import type { Task } from "../hooks/use-tasks";

interface TaskListItemProps {
  task: Task;
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onClick: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  [TaskPriority.URGENT]: "text-urgent",
  [TaskPriority.HIGH]: "text-high",
  [TaskPriority.MEDIUM]: "text-medium",
  [TaskPriority.LOW]: "text-low",
};

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

export function TaskListItem({ task, onToggleStatus, onClick }: TaskListItemProps) {
  const [toggling, setToggling] = useState(false);
  const isDone = task.status === TaskStatus.DONE;
  const priorityColor = PRIORITY_COLORS[task.priority];
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

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

  return (
    <button
      type="button"
      onClick={() => onClick(task.id)}
      className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface"
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
          "flex shrink-0 items-center justify-center rounded-full transition-colors",
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

      <span
        className={cn("flex-1 truncate", isDone ? "text-secondary line-through" : "text-primary")}
      >
        {task.title}
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {totalSubtasks > 0 && (
          <span className="text-secondary text-xs">
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs",
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
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full bg-current", priorityColor)} />
        )}
      </span>
    </button>
  );
}
