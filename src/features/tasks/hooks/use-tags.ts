import { useCallback, useEffect, useState } from "react";
import { parseApiError } from "~/platform/utils/api-error";
import type { Tag } from "../types";

export function useTags(projectId: string) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/tags`);

      if (!response.ok) {
        await parseApiError(response, "Failed to fetch tags");
      }

      const data = await response.json();
      setTags(data.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(
    async (name: string, color: string): Promise<Tag> => {
      const response = await fetch(`/api/projects/${projectId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to create tag");
      }

      const data = await response.json();
      setTags((prev) => [...prev, data.tag].sort((a, b) => a.name.localeCompare(b.name)));
      return data.tag;
    },
    [projectId],
  );

  const updateTag = useCallback(
    async (tagId: string, updates: Partial<Pick<Tag, "name" | "color">>): Promise<Tag> => {
      const response = await fetch(`/api/projects/${projectId}/tags/${tagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to update tag");
      }

      const data = await response.json();
      setTags((prev) =>
        prev
          .map((t) => (t.id === tagId ? data.tag : t))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return data.tag;
    },
    [projectId],
  );

  const deleteTag = useCallback(
    async (tagId: string): Promise<void> => {
      const response = await fetch(`/api/projects/${projectId}/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        await parseApiError(response, "Failed to delete tag");
      }

      setTags((prev) => prev.filter((t) => t.id !== tagId));
    },
    [projectId],
  );

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refetch: fetchTags,
  };
}
