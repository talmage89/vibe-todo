import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { SectionList } from "~/features/sections/components/section-list";
import { useSections } from "~/features/sections/hooks/use-sections";
import { SectionTaskList } from "~/features/tasks/components/section-task-list";
import { TaskCreateModal } from "~/features/tasks/components/task-create-modal";
import { TaskDetailModal } from "~/features/tasks/components/task-detail-modal";
import { useProjectTasks } from "~/features/tasks/hooks/use-project-tasks";
import { useTags } from "~/features/tasks/hooks/use-tags";
import { useTask } from "~/features/tasks/hooks/use-task";
import type { TaskStatus } from "~/platform/db/generated";

interface Project {
  id: string;
  name: string;
  color: string | null;
}

export function ProjectView() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalSectionId, setCreateModalSectionId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const {
    sections,
    loading: sectionsLoading,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
  } = useSections(projectId);

  const {
    tasksBySectionId,
    taskCountBySectionId,
    createTask,
    updateTask,
    deleteTask: deleteTaskFromList,
    refetch: refetchTasks,
  } = useProjectTasks(projectId);

  const { tags } = useTags(projectId);

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

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project");
      }

      setProject(data.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

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
    deleteTaskFromList(selectedTaskId);
    setDetailModalOpen(false);
    setSelectedTaskId(null);
    refetchTasks();
  }, [selectedTaskId, deleteSelectedTask, deleteTaskFromList, refetchTasks]);

  const handleUpdateSelectedTask = useCallback(
    async (...args: Parameters<typeof updateSelectedTask>) => {
      const result = await updateSelectedTask(...args);
      refetchTasks();
      return result;
    },
    [updateSelectedTask, refetchTasks],
  );

  const handleDetailModalOpenChange = useCallback(
    (open: boolean) => {
      setDetailModalOpen(open);
      if (!open) {
        setSelectedTaskId(null);
        refetchTasks();
      }
    },
    [refetchTasks],
  );

  const handleOpenCreateModal = useCallback((sectionId?: string | null) => {
    setCreateModalSectionId(sectionId ?? null);
    setCreateModalOpen(true);
  }, []);

  const renderSectionContent = useCallback(
    (sectionId: string, isCollapsed: boolean) => {
      if (isCollapsed) return null;
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
        <p className="text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-secondary text-sm">{error}</p>
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
      <header className="flex items-center justify-between border-border border-b px-6 py-4">
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
      </header>
      <main className="flex-1 overflow-y-auto p-6">
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
          <p className="text-secondary text-sm">Loading sections...</p>
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
        onUpdateTask={handleUpdateSelectedTask}
        onDeleteTask={handleDeleteSelectedTask}
        onCreateSubtask={createSubtask}
        onUpdateSubtask={updateSubtask}
        onDeleteSubtask={deleteSubtask}
        onReorderSubtasks={reorderSubtasks}
      />
    </div>
  );
}
