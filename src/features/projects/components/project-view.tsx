import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { SkeletonTaskList } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { SectionList } from "~/features/sections/components/section-list";
import { useSections } from "~/features/sections/hooks/use-sections";
import { SectionTaskList } from "~/features/tasks/components/section-task-list";
import { TagFilter } from "~/features/tasks/components/tag-filter";
import { TaskCreateModal } from "~/features/tasks/components/task-create-modal";
import { TaskDetailModal } from "~/features/tasks/components/task-detail-modal";
import { useProjectTasks } from "~/features/tasks/hooks/use-project-tasks";
import { useTags } from "~/features/tasks/hooks/use-tags";
import { useTask } from "~/features/tasks/hooks/use-task";
import type { TaskStatus } from "~/features/tasks/types";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Project } from "../types";

export function ProjectView() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const navigate = useNavigate();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalSectionId, setCreateModalSectionId] = useState<string | null>(null);
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

  const {
    sections,
    loading: sectionsLoading,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
  } = useSections(projectId);

  const { tasksBySectionId, taskCountBySectionId, createTask, updateTask } =
    useProjectTasks(projectId);

  const { tags } = useTags(projectId);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);

  const {
    task: selectedTask,
    loading: taskLoading,
    updateTask: updateSelectedTask,
    deleteTask: deleteSelectedTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
  } = useTask(projectId, selectedTaskId);

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

  const handleQuickAdd = useCallback(
    (sectionId: string | null) => async (title: string) => {
      await createTask({ title, sectionId });
    },
    [createTask],
  );

  const handleCreateTaskSubmit = useCallback(
    async (data: Parameters<typeof createTask>[0]) => {
      await createTask(data);
    },
    [createTask],
  );

  const handleDeleteSelectedTask = useCallback(async () => {
    if (!selectedTaskId) return;
    await deleteSelectedTask();
    setDetailModalOpen(false);
    setSelectedTaskId(null);
  }, [selectedTaskId, deleteSelectedTask]);

  const handleDetailModalOpenChange = useCallback((open: boolean) => {
    setDetailModalOpen(open);
    if (!open) {
      setSelectedTaskId(null);
    }
  }, []);

  const handleOpenCreateModal = useCallback((sectionId?: string | null) => {
    setCreateModalSectionId(sectionId ?? null);
    setCreateModalOpen(true);
  }, []);

  const renderSectionContent = useCallback(
    (sectionId: string, _isCollapsed: boolean) => {
      const sectionTasks = tasksBySectionId[sectionId] ?? [];
      return (
        <SectionTaskList
          tasks={sectionTasks}
          onToggleStatus={handleToggleStatus}
          onClickTask={handleClickTask}
          onQuickAdd={handleQuickAdd(sectionId)}
        />
      );
    },
    [tasksBySectionId, handleToggleStatus, handleClickTask, handleQuickAdd],
  );

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

  const unsectionedTasks = tasksBySectionId.__unsectioned ?? [];

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
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenCreateModal()}
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
        {tags.length > 0 && (
          <div className="border-border border-t px-4 py-1.5">
            <TagFilter tags={tags} selectedTagIds={filterTagIds} onChange={setFilterTagIds} />
          </div>
        )}
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-3">
        {unsectionedTasks.length > 0 && (
          <div className="mb-4">
            <SectionTaskList
              tasks={unsectionedTasks}
              onToggleStatus={handleToggleStatus}
              onClickTask={handleClickTask}
              onQuickAdd={handleQuickAdd(null)}
            />
          </div>
        )}

        {sectionsLoading ? (
          <SkeletonTaskList count={5} />
        ) : (
          <SectionList
            sections={sections}
            onCreateSection={createSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            onReorderSections={reorderSections}
            taskCountBySectionId={taskCountBySectionId}
            renderSectionContent={renderSectionContent}
          />
        )}
      </main>

      <TaskCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateTaskSubmit}
        tags={tags}
        sectionId={createModalSectionId}
      />

      <TaskDetailModal
        open={detailModalOpen}
        onOpenChange={handleDetailModalOpenChange}
        task={selectedTask}
        loading={taskLoading}
        sections={sections}
        availableTags={tags}
        onUpdateTask={updateSelectedTask}
        onDeleteTask={handleDeleteSelectedTask}
        onCreateSubtask={createSubtask}
        onUpdateSubtask={updateSubtask}
        onDeleteSubtask={deleteSubtask}
        onReorderSubtasks={reorderSubtasks}
      />
    </div>
  );
}
