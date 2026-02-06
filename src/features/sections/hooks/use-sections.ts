import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Section } from "../types";

interface SectionsResponse {
  sections: Section[];
}

interface SectionResponse {
  section: Section;
}

export function useSections(projectId: string) {
  const queryClient = useQueryClient();
  const sectionsKey = queryKeys.sections.all(projectId);

  const {
    data: sections = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: sectionsKey,
    queryFn: () => api<SectionsResponse>(`/api/projects/${projectId}/sections`),
    select: (data) => data.sections,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      api<SectionResponse>(`/api/projects/${projectId}/sections`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionsKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ sectionId, name }: { sectionId: string; name: string }) =>
      api<SectionResponse>(`/api/projects/${projectId}/sections/${sectionId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionsKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sectionId: string) =>
      api<void>(`/api/projects/${projectId}/sections/${sectionId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionsKey });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (sectionIds: string[]) =>
      api<SectionsResponse>(`/api/projects/${projectId}/sections/reorder`, {
        method: "POST",
        body: JSON.stringify({ sectionIds }),
      }),
    onMutate: async (sectionIds) => {
      await queryClient.cancelQueries({ queryKey: sectionsKey });
      const previous = queryClient.getQueryData<SectionsResponse>(sectionsKey);
      queryClient.setQueryData<SectionsResponse>(sectionsKey, (old) => {
        if (!old) return old;
        const sectionMap = new Map(old.sections.map((s) => [s.id, s]));
        const reordered = sectionIds
          .map((id, index) => {
            const section = sectionMap.get(id);
            if (!section) return null;
            return { ...section, position: index };
          })
          .filter((s): s is Section => s !== null);
        return { sections: reordered };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(sectionsKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sectionsKey });
    },
  });

  const createSection = async (name: string): Promise<Section> => {
    const data = await createMutation.mutateAsync(name);
    return data.section;
  };

  const updateSection = async (sectionId: string, name: string): Promise<Section> => {
    const data = await updateMutation.mutateAsync({ sectionId, name });
    return data.section;
  };

  const deleteSection = async (sectionId: string): Promise<void> => {
    await deleteMutation.mutateAsync(sectionId);
  };

  const reorderSections = async (sectionIds: string[]): Promise<void> => {
    await reorderMutation.mutateAsync(sectionIds);
  };

  return {
    sections,
    loading,
    error: queryError?.message ?? null,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
  };
}
