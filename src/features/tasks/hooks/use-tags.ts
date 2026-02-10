import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Tag } from "../types";

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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: tagsKey });
      const previous = queryClient.getQueryData<TagsResponse>(tagsKey);
      queryClient.setQueryData<TagsResponse>(tagsKey, (old) => {
        if (!old) return old;
        const optimistic: Tag = {
          id: `temp-${crypto.randomUUID()}`,
          name: input.name,
          color: input.color,
        };
        return { tags: [...old.tags, optimistic] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tagsKey, context.previous);
    },
    onSettled: () => {
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
    onMutate: async ({ tagId, updates }) => {
      await queryClient.cancelQueries({ queryKey: tagsKey });
      const previous = queryClient.getQueryData<TagsResponse>(tagsKey);
      queryClient.setQueryData<TagsResponse>(tagsKey, (old) => {
        if (!old) return old;
        return {
          tags: old.tags.map((t) => (t.id === tagId ? { ...t, ...updates } : t)),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tagsKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) =>
      api<void>(`/api/projects/${projectId}/tags/${tagId}`, { method: "DELETE" }),
    onMutate: async (tagId) => {
      await queryClient.cancelQueries({ queryKey: tagsKey });
      const previous = queryClient.getQueryData<TagsResponse>(tagsKey);
      queryClient.setQueryData<TagsResponse>(tagsKey, (old) => {
        if (!old) return old;
        return { tags: old.tags.filter((t) => t.id !== tagId) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tagsKey, context.previous);
    },
    onSettled: () => {
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
