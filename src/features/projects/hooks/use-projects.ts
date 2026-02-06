import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Project } from "~/types/models";

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

export const useProjects = () => {
  const queryClient = useQueryClient();

  const {
    data: projects = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => api<ProjectsResponse>("/api/projects"),
    select: (data) => data.projects,
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string; color?: string }) =>
      api<ProjectResponse>("/api/projects", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });

  const createProject = async (input: { name: string; color?: string }): Promise<Project> => {
    const data = await createMutation.mutateAsync(input);
    return data.project;
  };

  return {
    projects,
    loading,
    error: queryError?.message ?? null,
    createProject,
  };
};
