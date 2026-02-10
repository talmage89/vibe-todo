import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTaskData, TaskStatus } from "~/features/tasks/types";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { TaskWithProject } from "../types";

interface TodayTasksResponse {
  tasks: TaskWithProject[];
}

export function useTodayTasks() {
  const queryClient = useQueryClient();

  const { data: todayTasks = [], isLoading: todayLoading } = useQuery({
    queryKey: queryKeys.crossProjectTasks.today,
    queryFn: () => api<TodayTasksResponse>("/api/tasks/today"),
    select: (data) => data.tasks,
  });

  const { data: overdueTasks = [], isLoading: overdueLoading } = useQuery({
    queryKey: queryKeys.crossProjectTasks.overdue,
    queryFn: () => api<TodayTasksResponse>("/api/tasks/overdue"),
    select: (data) => data.tasks,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      projectId,
      taskId,
      data,
    }: {
      projectId: string;
      taskId: string;
      data: Partial<CreateTaskData> & { status?: TaskStatus };
    }) =>
      api(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crossProjectTasks.today });
      queryClient.invalidateQueries({ queryKey: queryKeys.crossProjectTasks.overdue });
    },
  });

  const updateTask = async (
    projectId: string,
    taskId: string,
    data: Partial<CreateTaskData> & { status?: TaskStatus },
  ) => {
    await updateMutation.mutateAsync({ projectId, taskId, data });
  };

  return {
    todayTasks,
    overdueTasks,
    loading: todayLoading || overdueLoading,
    updateTask,
  };
}
