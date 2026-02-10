import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { cn } from "~/components/ui/cn";
import { toTaskSortId } from "../hooks/use-task-drag-drop";
import type { Tag, Task, TaskStatus, TaskUpdates } from "../types";
import { TaskListItem } from "./task-list-item";

interface SortableTaskItemProps {
  task: Task;
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onUpdateTask: (taskId: string, updates: TaskUpdates) => Promise<unknown>;
  onClick: (taskId: string) => void;
  availableTags?: Tag[];
}

export function SortableTaskItem({
  task,
  onToggleStatus,
  onUpdateTask,
  onClick,
  availableTags,
}: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: toTaskSortId(task.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group/drag flex items-center", isDragging && "opacity-50")}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-secondary opacity-0 transition-opacity hover:text-primary group-hover/drag:opacity-100"
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <TaskListItem
          task={task}
          onToggleStatus={onToggleStatus}
          onUpdateTask={onUpdateTask}
          onClick={onClick}
          availableTags={availableTags}
        />
      </div>
    </div>
  );
}
