import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";
import { EmptyState } from "~/components/ui/empty-state";
import { TaskListItem } from "~/features/tasks/components/task-list-item";
import type { TaskStatus, TaskUpdates } from "~/features/tasks/types";
import { useUpcomingTasks } from "../hooks/use-upcoming-tasks";
import type { CrossProjectTask } from "../types";

type DateGroup = {
  label: string;
  tasks: CrossProjectTask[];
};

function getDateLabel(dateStr: string): string {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 6) {
    return target.toLocaleDateString("en-US", { weekday: "long" });
  }

  return target.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function groupTasksByDate(tasks: CrossProjectTask[]): DateGroup[] {
  const groups = new Map<string, CrossProjectTask[]>();

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const label = getDateLabel(task.dueDate);
    const existing = groups.get(label);
    if (existing) {
      existing.push(task);
    } else {
      groups.set(label, [task]);
    }
  }

  return Array.from(groups, ([label, tasks]) => ({ label, tasks }));
}

export const UpcomingView = () => {
  const { tasks, loading, toggleStatus, updateTask } = useUpcomingTasks();

  const dateGroups = useMemo(() => groupTasksByDate(tasks), [tasks]);

  const handleToggleStatus = async (task: CrossProjectTask, status: TaskStatus) => {
    await toggleStatus(task.projectId, task.id, status);
  };

  const handleUpdateTask = async (task: CrossProjectTask, updates: TaskUpdates) => {
    await updateTask(task.projectId, task.id, updates);
  };

  const isEmpty = !loading && tasks.length === 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 items-center border-border border-b px-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-secondary" />
          <h1 className="font-semibold text-sm">Upcoming</h1>
        </div>
      </div>
      {isEmpty ? (
        <EmptyState
          icon={CalendarDaysIcon}
          title="No upcoming tasks"
          description="Tasks due within the next 7 days across all projects will appear here"
          className="flex-1"
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {dateGroups.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 z-10 border-border border-b bg-background px-4 py-2">
                <h2 className="font-medium text-secondary text-xs uppercase tracking-wider">
                  {group.label}
                </h2>
              </div>
              <div className="px-1 py-0.5">
                {group.tasks.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onToggleStatus={(_taskId, status) => handleToggleStatus(task, status)}
                    onUpdateTask={(_taskId, updates) => handleUpdateTask(task, updates)}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
