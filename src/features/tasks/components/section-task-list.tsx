import type { TaskStatus } from "~/platform/db/generated";
import type { Task } from "../hooks/use-tasks";
import { TaskListItem } from "./task-list-item";
import { TaskQuickAdd } from "./task-quick-add";

interface SectionTaskListProps {
  tasks: Task[];
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onClickTask: (taskId: string) => void;
  onQuickAdd: (title: string) => Promise<void>;
}

export function SectionTaskList({
  tasks,
  onToggleStatus,
  onClickTask,
  onQuickAdd,
}: SectionTaskListProps) {
  return (
    <div className="pb-1 pl-6">
      {tasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          onToggleStatus={onToggleStatus}
          onClick={onClickTask}
        />
      ))}
      <TaskQuickAdd onSubmit={onQuickAdd} />
    </div>
  );
}
