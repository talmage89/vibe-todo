import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Task, TaskUpdates } from "~/features/tasks/types";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import { parseSearchQuery } from "../parse-search-query";
import type { SearchTasksResponse } from "../types";

interface TaskResponse {
  task: Task;
}

function buildSearchUrl(rawQuery: string): string {
  const parsed = parseSearchQuery(rawQuery);
  const params = new URLSearchParams();

  if (parsed.text) params.set("q", parsed.text);
  if (parsed.status) params.set("status", parsed.status);
  if (parsed.priority) params.set("priority", parsed.priority);
  if (parsed.projectName) params.set("projectName", parsed.projectName);
  if (parsed.dateFilter) params.set("dateFilter", parsed.dateFilter);

  return `/api/search?${params.toString()}`;
}

export function useSearchTasks(rawQuery: string) {
  const queryClient = useQueryClient();
  const searchKey = queryKeys.crossProjectTasks.search(rawQuery);
  const parsed = useMemo(() => parseSearchQuery(rawQuery), [rawQuery]);

  const hasFilters =
    !!parsed.text ||
    !!parsed.status ||
    !!parsed.priority ||
    !!parsed.projectName ||
    !!parsed.dateFilter;

  const {
    data: tasks = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: searchKey,
    queryFn: () => api<SearchTasksResponse>(buildSearchUrl(rawQuery)),
    select: (data) => data.results,
    enabled: hasFilters,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      projectId,
      taskId,
      updates,
    }: {
      projectId: string;
      taskId: string;
      updates: TaskUpdates;
    }) =>
      api<TaskResponse>(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKey });
    },
  });

  const toggleStatus = async (projectId: string, taskId: string, updates: TaskUpdates) => {
    await updateMutation.mutateAsync({ projectId, taskId, updates });
  };

  const updateTask = async (projectId: string, taskId: string, updates: TaskUpdates) => {
    await updateMutation.mutateAsync({ projectId, taskId, updates });
  };

  return {
    tasks,
    loading,
    error: queryError?.message ?? null,
    textQuery: parsed.text,
    toggleStatus,
    updateTask,
  };
}
