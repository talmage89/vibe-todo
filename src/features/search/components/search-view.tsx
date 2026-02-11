import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useMemo, useRef, useState } from "react";
import { EmptySearchResults } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { SkeletonSearchResults } from "~/components/ui/skeleton";
import { TaskDetailModal } from "~/features/tasks/components/task-detail-modal";
import { TaskListItem } from "~/features/tasks/components/task-list-item";
import type { TaskStatus, TaskUpdates } from "~/features/tasks/types";
import { useSearchTasks } from "../hooks/use-search-tasks";
import type { SearchTask } from "../types";

interface ProjectGroup {
  projectId: string;
  projectName: string;
  projectColor: string | null;
  tasks: SearchTask[];
}

function groupByProject(tasks: SearchTask[]): ProjectGroup[] {
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

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-accent/20 text-primary">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

function getDescriptionSnippet(description: string | null, query: string): string | null {
  if (!description) return null;
  const lower = description.toLowerCase();
  const qLower = query.toLowerCase();
  const index = lower.indexOf(qLower);
  if (index === -1) return null;
  const contextChars = 60;
  const start = Math.max(0, index - contextChars);
  const end = Math.min(description.length, index + query.length + contextChars);
  let snippet = description.slice(start, end);
  if (start > 0) snippet = `...${snippet}`;
  if (end < description.length) snippet = `${snippet}...`;
  return snippet;
}

export const SearchView = () => {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const { tasks, loading, error, toggleStatus, updateTask } = useSearchTasks(query);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = useMemo(() => groupByProject(tasks), [tasks]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(value.trim());
    }, 300);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue("");
    setQuery("");
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && inputValue) {
        e.preventDefault();
        handleClear();
      }
    },
    [inputValue, handleClear],
  );

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

  const hasQuery = query.length > 0;
  const showResults = hasQuery && !loading && !error && tasks.length > 0;
  const showEmpty = hasQuery && !loading && !error && tasks.length === 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 items-center gap-2 border-border border-b px-4">
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-secondary" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks..."
          className="h-8 flex-1 border-none bg-transparent shadow-none focus-visible:ring-0"
          autoFocus
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-secondary transition-colors hover:bg-surface hover:text-primary"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {!hasQuery && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-secondary text-sm">Type to search across all tasks</p>
        </div>
      )}

      {loading && (
        <div className="px-4 py-3">
          <SkeletonSearchResults count={6} />
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-secondary text-sm">{error}</p>
        </div>
      )}

      {showEmpty && <EmptySearchResults query={query} onClear={handleClear} className="flex-1" />}

      {showResults && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3">
            <p className="mb-3 px-3 text-secondary text-xs">
              {tasks.length} {tasks.length === 1 ? "result" : "results"}
            </p>
            {groups.map((group) => (
              <SearchProjectGroup
                key={group.projectId}
                group={group}
                query={query}
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

function SearchProjectGroup({
  group,
  query,
  onToggleStatus,
  onUpdateTask,
  onClickTask,
}: {
  group: ProjectGroup;
  query: string;
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
        <SearchResultItem
          key={task.id}
          task={task}
          query={query}
          onToggleStatus={handleToggleStatus}
          onUpdateTask={handleUpdateTask}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}

function SearchResultItem({
  task,
  query,
  onToggleStatus,
  onUpdateTask,
  onClick,
}: {
  task: SearchTask;
  query: string;
  onToggleStatus: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onUpdateTask: (taskId: string, updates: TaskUpdates) => Promise<unknown>;
  onClick: (taskId: string) => void;
}) {
  const descriptionSnippet = useMemo(
    () => getDescriptionSnippet(task.description, query),
    [task.description, query],
  );

  return (
    <div>
      <TaskListItem
        task={task}
        onToggleStatus={onToggleStatus}
        onUpdateTask={onUpdateTask}
        onClick={onClick}
      />
      {descriptionSnippet && (
        <p className="truncate px-10 pb-1 text-secondary text-xs">
          {highlightMatch(descriptionSnippet, query)}
        </p>
      )}
    </div>
  );
}
