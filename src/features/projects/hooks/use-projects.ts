import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Project } from "../types";

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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all });
      const previous = queryClient.getQueryData<ProjectsResponse>(queryKeys.projects.all);
      queryClient.setQueryData<ProjectsResponse>(queryKeys.projects.all, (old) => {
        if (!old) return old;
        const optimistic: Project = {
          id: `temp-${crypto.randomUUID()}`,
          name: input.name,
          color: input.color ?? null,
          defaultView: "LIST",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { projects: [...old.projects, optimistic] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.projects.all, context.previous);
    },
    onSettled: () => {
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
