import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Tag } from "~/types/models";

interface TagsResponse {
  tags: Tag[];
}

interface TagResponse {
  tag: Tag;
}

export function useTags(projectId: string) {
  const queryClient = useQueryClient();
  const tagsKey = queryKeys.tags.all(projectId);

  const {
    data: tags = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: tagsKey,
    queryFn: () => api<TagsResponse>(`/api/projects/${projectId}/tags`),
    select: (data) => [...data.tags].sort((a, b) => a.name.localeCompare(b.name)),
  });

  const createMutation = useMutation({
    mutationFn: (input: { name: string; color: string }) =>
      api<TagResponse>(`/api/projects/${projectId}/tags`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      tagId,
      updates,
    }: {
      tagId: string;
      updates: Partial<Pick<Tag, "name" | "color">>;
    }) =>
      api<TagResponse>(`/api/projects/${projectId}/tags/${tagId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) =>
      api<void>(`/api/projects/${projectId}/tags/${tagId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey });
    },
  });

  const createTag = async (name: string, color: string): Promise<Tag> => {
    const data = await createMutation.mutateAsync({ name, color });
    return data.tag;
  };

  const updateTag = async (
    tagId: string,
    updates: Partial<Pick<Tag, "name" | "color">>,
  ): Promise<Tag> => {
    const data = await updateMutation.mutateAsync({ tagId, updates });
    return data.tag;
  };

  const deleteTag = async (tagId: string): Promise<void> => {
    await deleteMutation.mutateAsync(tagId);
  };

  return {
    tags,
    loading,
    error: queryError?.message ?? null,
    createTag,
    updateTag,
    deleteTag,
  };
}
