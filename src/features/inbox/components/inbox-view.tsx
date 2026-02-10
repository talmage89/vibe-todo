import { InboxIcon } from "@heroicons/react/24/outline";
import { useCallback, useMemo, useState } from "react";
import { EmptyState } from "~/components/ui/empty-state";
import { SkeletonTaskList } from "~/components/ui/skeleton";
import { TaskDetailModal } from "~/features/tasks/components/task-detail-modal";
import { TaskListItem } from "~/features/tasks/components/task-list-item";
import type { TaskStatus, TaskUpdates } from "~/features/tasks/types";
import { type InboxTask, useInboxTasks } from "../hooks/use-inbox-tasks";

interface ProjectGroup {
  projectId: string;
  projectName: string;
  projectColor: string | null;
  tasks: InboxTask[];
}

function groupByProject(tasks: InboxTask[]): ProjectGroup[] {
  const groups = new Map<string, ProjectGroup>();
  for (const task of tasks) {
    let group = groups.get(task.project.id);
    if (!group) {
      group = {
        projectId: task.project.id,
        projectName: task.project.name,
        projectColor: task.project.color,
        tasks: [],
      };
      groups.set(task.project.id, group);
    }
    group.tasks.push(task);
  }
  return Array.from(groups.values());
}

export const InboxView = () => {
  const { tasks, loading, error, toggleStatus, updateTask } = useInboxTasks();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const groups = useMemo(() => groupByProject(tasks), [tasks]);

  const handleClickTask = useCallback((taskId: string, projectId: string) => {
    setSelectedTaskId(taskId);
    setSelectedProjectId(projectId);
    setDetailModalOpen(true);
  }, []);

  const handleDetailModalOpenChange = useCallback((open: boolean) => {
    setDetailModalOpen(open);
    if (!open) {
      setSelectedTaskId(null);
      setSelectedProjectId(null);
    }
  }, []);

  const handleTaskDeleted = useCallback(() => {
    setSelectedTaskId(null);
    setSelectedProjectId(null);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex h-12 items-center border-border border-b px-4">
          <div className="flex items-center gap-2">
            <InboxIcon className="h-5 w-5 text-secondary" />
            <h1 className="font-semibold text-sm">Inbox</h1>
          </div>
        </div>
        <div className="px-4 py-3">
          <SkeletonTaskList count={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex h-12 items-center border-border border-b px-4">
          <div className="flex items-center gap-2">
            <InboxIcon className="h-5 w-5 text-secondary" />
            <h1 className="font-semibold text-sm">Inbox</h1>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 items-center border-border border-b px-4">
        <div className="flex items-center gap-2">
          <InboxIcon className="h-5 w-5 text-secondary" />
          <h1 className="font-semibold text-sm">Inbox</h1>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No tasks in inbox"
          description="Tasks across all projects will appear here"
          className="flex-1"
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3">
            {groups.map((group) => (
              <ProjectTaskGroup
                key={group.projectId}
                group={group}
                onToggleStatus={toggleStatus}
                onUpdateTask={updateTask}
                onClickTask={handleClickTask}
              />
            ))}
          </div>
        </div>
      )}

      {selectedProjectId && (
        <TaskDetailModal
          open={detailModalOpen}
          onOpenChange={handleDetailModalOpenChange}
          projectId={selectedProjectId}
          taskId={selectedTaskId}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
};

function ProjectTaskGroup({
  group,
  onToggleStatus,
  onUpdateTask,
  onClickTask,
}: {
  group: ProjectGroup;
  onToggleStatus: (projectId: string, taskId: string, updates: TaskUpdates) => Promise<unknown>;
  onUpdateTask: (projectId: string, taskId: string, updates: TaskUpdates) => Promise<unknown>;
  onClickTask: (taskId: string, projectId: string) => void;
}) {
  const handleToggleStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await onToggleStatus(group.projectId, taskId, { status });
    },
    [group.projectId, onToggleStatus],
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: TaskUpdates) => {
      await onUpdateTask(group.projectId, taskId, updates);
    },
    [group.projectId, onUpdateTask],
  );

  const handleClick = useCallback(
    (taskId: string) => {
      onClickTask(taskId, group.projectId);
    },
    [group.projectId, onClickTask],
  );

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 px-3 py-1.5">
        {group.projectColor && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            aria-hidden="true"
            style={{ backgroundColor: group.projectColor }}
          />
        )}
        <h2 className="font-medium text-secondary text-xs uppercase tracking-wide">
          {group.projectName}
        </h2>
      </div>
      {group.tasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          onToggleStatus={handleToggleStatus}
          onUpdateTask={handleUpdateTask}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}
