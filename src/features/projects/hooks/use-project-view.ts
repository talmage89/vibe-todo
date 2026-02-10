import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DefaultView } from "~/platform/db/generated";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Project } from "../types";

export function useProjectView(projectId: string, currentView: DefaultView) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (defaultView: DefaultView) =>
      api<{ project: Project }>(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ defaultView }),
      }),
    onMutate: async (defaultView) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.detail(projectId) });
      const previous = queryClient.getQueryData(queryKeys.projects.detail(projectId));
      queryClient.setQueryData(
        queryKeys.projects.detail(projectId),
        (old: { project: Project } | undefined) =>
          old ? { project: { ...old.project, defaultView } } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.projects.detail(projectId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });

  return {
    view: currentView,
    setView: (next: DefaultView) => mutation.mutate(next),
  } as const;
}
