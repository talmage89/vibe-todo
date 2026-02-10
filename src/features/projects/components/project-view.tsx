import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { SkeletonTaskList } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { KanbanBoard } from "~/features/tasks/components/kanban-board";
import { TaskList } from "~/features/tasks/components/section-task-list";
import { TagFilter } from "~/features/tasks/components/tag-filter";
import { TaskCreateModal } from "~/features/tasks/components/task-create-modal";
import { TaskDetailModal } from "~/features/tasks/components/task-detail-modal";
import { useProjectTasks } from "~/features/tasks/hooks/use-project-tasks";
import { useTags } from "~/features/tasks/hooks/use-tags";
import { useTaskDragDrop } from "~/features/tasks/hooks/use-task-drag-drop";
import type { TaskStatus, TaskUpdates } from "~/features/tasks/types";
import { DefaultView } from "~/platform/db/generated";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import { useProjectView } from "../hooks/use-project-view";
import type { Project } from "../types";
import { ViewToggle } from "./view-toggle";

export function ProjectView() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const navigate = useNavigate();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const {
    data: project,
    isLoading: loading,
    error: projectError,
  } = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => api<{ project: Project }>(`/api/projects/${projectId}`),
    select: (data) => data.project,
  });

  const { view, setView } = useProjectView(projectId, project?.defaultView ?? DefaultView.KANBAN);

  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    reorderTasks,
  } = useProjectTasks(projectId);

  const { tags } = useTags(projectId);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { activeTask, collisionDetection, handleDragStart, handleDragEnd, handleDragCancel } =
    useTaskDragDrop({
      tasks,
      onReorderTasks: reorderTasks,
    });

  const handleClickTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailModalOpen(true);
  }, []);

  const handleToggleStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await updateTask(taskId, { status });
    },
    [updateTask],
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: TaskUpdates) => {
      const { description, dueDate, ...rest } = updates;
      const payload: Parameters<typeof updateTask>[1] = { ...rest };
      if (description !== undefined) {
        payload.description = description ?? undefined;
      }
      if (dueDate !== undefined) {
        payload.dueDate = dueDate ? new Date(dueDate) : undefined;
      }
      await updateTask(taskId, payload);
    },
    [updateTask],
  );

  const handleQuickAdd = useCallback(
    async (title: string) => {
      await createTask({ title });
    },
    [createTask],
  );

  const handleCreateTaskSubmit = useCallback(
    async (data: Parameters<typeof createTask>[0]) => {
      await createTask(data);
    },
    [createTask],
  );

  const handleDetailModalOpenChange = useCallback((open: boolean) => {
    setDetailModalOpen(open);
    if (!open) {
      setSelectedTaskId(null);
    }
  }, []);

  const handleTaskDeleted = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label="Loading project..." />
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-secondary text-sm">{projectError.message}</p>
        <Button variant="secondary" onClick={() => navigate({ to: "/" })}>
          Go back
        </Button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-border border-b">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            {project.color && (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                aria-hidden="true"
                style={{ backgroundColor: project.color }}
              />
            )}
            <h1 className="font-semibold text-lg text-primary">{project.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle value={view} onChange={setView} />
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                title="Create task"
              >
                <PlusIcon className="h-4 w-4" />
                Add task
              </Button>
              <Link
                to="/project/$projectId/settings"
                params={{ projectId }}
                className="rounded p-1.5 text-secondary transition-colors hover:bg-surface hover:text-primary"
                title="Project settings"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="border-border border-t px-4 py-1.5">
            <TagFilter tags={tags} selectedTagIds={filterTagIds} onChange={setFilterTagIds} />
          </div>
        )}
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className={view === DefaultView.LIST ? "block" : "hidden"}>
          <div className="px-4 py-3">
            {tasksLoading ? (
              <SkeletonTaskList count={5} />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <TaskList
                  tasks={tasks}
                  onToggleStatus={handleToggleStatus}
                  onUpdateTask={handleUpdateTask}
                  onClickTask={handleClickTask}
                  onQuickAdd={handleQuickAdd}
                  availableTags={tags}
                />

                <DragOverlay>
                  {activeTask ? (
                    <div className="rounded border border-border bg-background px-3 py-1.5 text-primary text-sm shadow-lg">
                      {activeTask.title}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
        {view === DefaultView.KANBAN && (
          <KanbanBoard
            tasks={tasks}
            onClickTask={handleClickTask}
            onUpdateTaskStatus={handleToggleStatus}
          />
        )}
      </main>

      <TaskCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateTaskSubmit}
        tags={tags}
      />

      <TaskDetailModal
        open={detailModalOpen}
        onOpenChange={handleDetailModalOpenChange}
        projectId={projectId}
        taskId={selectedTaskId}
        availableTags={tags}
        onDeleted={handleTaskDeleted}
      />
    </div>
  );
}
