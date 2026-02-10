import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { toTaskSortId } from "../hooks/use-task-drag-drop";
import type { Tag, Task, TaskStatus, TaskUpdates } from "../types";
import { SortableTaskItem } from "./sortable-task-item";
import { TaskQuickAdd } from "./task-quick-add";

interface SectionTaskListProps {
  sectionId: string;
  tasks: Task[];
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onUpdateTask: (taskId: string, updates: TaskUpdates) => Promise<unknown>;
  onClickTask: (taskId: string) => void;
  onQuickAdd: (title: string) => Promise<void>;
  availableTags?: Tag[];
}

export function SectionTaskList({
  sectionId,
  tasks,
  onToggleStatus,
  onUpdateTask,
  onClickTask,
  onQuickAdd,
  availableTags,
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
            onUpdateTask={onUpdateTask}
            onClick={onClickTask}
            availableTags={availableTags}
          />
        ))}
      </SortableContext>
      <div className="pl-5">
        <TaskQuickAdd onSubmit={onQuickAdd} />
      </div>
    </div>
  );
}
