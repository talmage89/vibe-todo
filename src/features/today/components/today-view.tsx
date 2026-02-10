import { CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { EmptyState } from "~/components/ui/empty-state";
import { SkeletonTaskList } from "~/components/ui/skeleton";
import { TaskDetailModal } from "~/features/tasks/components/task-detail-modal";
import { TaskListItem } from "~/features/tasks/components/task-list-item";
import type { TaskStatus, TaskUpdates } from "~/features/tasks/types";
import { useTodayTasks } from "../hooks/use-today-tasks";
import type { TaskWithProject } from "../types";

function groupByProject(tasks: TaskWithProject[]) {
  const groups: {
    project: { id: string; name: string; color: string };
    tasks: TaskWithProject[];
  }[] = [];
  const map = new Map<string, (typeof groups)[number]>();

  for (const task of tasks) {
    let group = map.get(task.project.id);
    if (!group) {
      group = { project: task.project, tasks: [] };
      map.set(task.project.id, group);
      groups.push(group);
    }
    group.tasks.push(task);
  }

  return groups;
}

export const TodayView = () => {
  const { todayTasks, overdueTasks, loading, updateTask } = useTodayTasks();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);

  const handleClickTask = useCallback(
    (taskId: string) => {
      const task =
        todayTasks.find((t) => t.id === taskId) ?? overdueTasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setDetailModalOpen(true);
      }
    },
    [todayTasks, overdueTasks],
  );

  const handleToggleStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const task =
        todayTasks.find((t) => t.id === taskId) ?? overdueTasks.find((t) => t.id === taskId);
      if (task) {
        await updateTask(task.project.id, taskId, { status });
      }
    },
    [todayTasks, overdueTasks, updateTask],
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: TaskUpdates) => {
      const task =
        todayTasks.find((t) => t.id === taskId) ?? overdueTasks.find((t) => t.id === taskId);
      if (task) {
        const { description, dueDate, ...rest } = updates;
        const payload: Parameters<typeof updateTask>[2] = { ...rest };
        if (description !== undefined) {
          payload.description = description ?? undefined;
        }
        if (dueDate !== undefined) {
          payload.dueDate = dueDate ? new Date(dueDate) : undefined;
        }
        await updateTask(task.project.id, taskId, payload);
      }
    },
    [todayTasks, overdueTasks, updateTask],
  );

  const handleDetailModalOpenChange = useCallback((open: boolean) => {
    setDetailModalOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  }, []);

  const handleTaskDeleted = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const overdueGroups = groupByProject(overdueTasks);
  const todayGroups = groupByProject(todayTasks);
  const isEmpty = overdueTasks.length === 0 && todayTasks.length === 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 items-center border-border border-b px-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-secondary" />
          <h1 className="font-semibold text-sm">Today</h1>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-3">
          <SkeletonTaskList count={5} />
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={CalendarIcon}
          title="No tasks due today"
          description="Tasks due today across all projects will appear here"
          className="flex-1"
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {overdueGroups.length > 0 && (
            <TaskSection
              label="Overdue"
              icon={<ClockIcon className="h-4 w-4 text-urgent" />}
              groups={overdueGroups}
              onToggleStatus={handleToggleStatus}
              onUpdateTask={handleUpdateTask}
              onClickTask={handleClickTask}
            />
          )}

          {todayGroups.length > 0 && (
            <TaskSection
              label="Today"
              icon={<CalendarIcon className="h-4 w-4 text-secondary" />}
              groups={todayGroups}
              onToggleStatus={handleToggleStatus}
              onUpdateTask={handleUpdateTask}
              onClickTask={handleClickTask}
            />
          )}
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          open={detailModalOpen}
          onOpenChange={handleDetailModalOpenChange}
          projectId={selectedTask.project.id}
          taskId={selectedTask.id}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
};

function TaskSection({
  label,
  icon,
  groups,
  onToggleStatus,
  onUpdateTask,
  onClickTask,
}: {
  label: string;
  icon: React.ReactNode;
  groups: ReturnType<typeof groupByProject>;
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onUpdateTask: (taskId: string, updates: TaskUpdates) => Promise<unknown>;
  onClickTask: (taskId: string) => void;
}) {
  return (
    <div className="border-border border-b last:border-b-0">
      <div className="flex items-center gap-2 px-4 py-2">
        {icon}
        <span className="font-medium text-secondary text-xs uppercase tracking-wider">{label}</span>
      </div>
      {groups.map((group) => (
        <div key={group.project.id}>
          <div className="flex items-center gap-2 px-4 py-1">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              aria-hidden="true"
              style={{ backgroundColor: group.project.color }}
            />
            <span className="font-medium text-primary text-xs">{group.project.name}</span>
          </div>
          <div className="px-1">
            {group.tasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onToggleStatus={onToggleStatus}
                onUpdateTask={onUpdateTask}
                onClick={onClickTask}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
