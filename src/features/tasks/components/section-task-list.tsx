import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toTaskSortId } from "../hooks/use-task-drag-drop";
import type { Task, TaskStatus } from "../types";
import { SortableTaskItem } from "./sortable-task-item";
import { TaskQuickAdd } from "./task-quick-add";

interface SectionTaskListProps {
  sectionId: string;
  tasks: Task[];
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onClickTask: (taskId: string) => void;
  onQuickAdd: (title: string) => Promise<void>;
}

export function SectionTaskList({
  sectionId,
  tasks,
  onToggleStatus,
  onClickTask,
  onQuickAdd,
}: SectionTaskListProps) {
  const { setNodeRef } = useDroppable({ id: sectionId });

  return (
    <div ref={setNodeRef} className="pb-1 pl-2">
      <SortableContext
        id={sectionId}
        items={tasks.map((t) => toTaskSortId(t.id))}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <SortableTaskItem
            key={task.id}
            task={task}
            onToggleStatus={onToggleStatus}
            onClick={onClickTask}
          />
        ))}
      </SortableContext>
      <div className="pl-5">
        <TaskQuickAdd onSubmit={onQuickAdd} />
      </div>
    </div>
  );
}
