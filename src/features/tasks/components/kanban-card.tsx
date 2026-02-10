import { CalendarIcon } from "@heroicons/react/24/outline";
import { cn } from "~/components/ui/cn";
import type { Task } from "../types";
import { TaskPriority } from "../types";
import { TagChip } from "./tag-chip";

interface KanbanCardProps {
  task: Task;
  onClick: (taskId: string) => void;
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  [TaskPriority.URGENT]: { label: "Urgent", className: "bg-urgent/10 text-urgent" },
  [TaskPriority.HIGH]: { label: "High", className: "bg-high/10 text-high" },
  [TaskPriority.MEDIUM]: { label: "Medium", className: "bg-medium/10 text-medium" },
  [TaskPriority.LOW]: { label: "Low", className: "bg-low/10 text-low" },
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

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const priorityBadge = PRIORITY_BADGE[task.priority];
  const visibleTags = task.tags.slice(0, 2);
  const remainingTags = task.tags.length - 2;

  return (
    <button
      type="button"
      onClick={() => onClick(task.id)}
      className="w-full rounded border border-border bg-background p-2.5 text-left transition-colors hover:bg-surface"
    >
      <span className="block truncate text-primary text-sm">{task.title}</span>

      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {priorityBadge && (
          <span
            className={cn(
              "inline-flex items-center rounded px-1.5 py-0.5 font-medium text-xs",
              priorityBadge.className,
            )}
          >
            {priorityBadge.label}
          </span>
        )}

        {task.dueDate && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs",
              isDueDateOverdue(task.dueDate) ? "text-urgent" : "text-secondary",
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {formatDueDate(task.dueDate)}
          </span>
        )}

        {visibleTags.length > 0 && (
          <>
            {visibleTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} className="leading-none" />
            ))}
            {remainingTags > 0 && <span className="text-secondary text-xs">+{remainingTags}</span>}
          </>
        )}
      </span>
    </button>
  );
}
