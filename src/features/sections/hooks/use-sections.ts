import { useCallback, useEffect, useState } from "react";
import type { Section } from "../types";

interface SectionResponse {
  section: Section;
}

export function useSections(projectId: string) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/sections`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sections");
      }

      setSections(data.sections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const createSection = useCallback(
    async (name: string): Promise<Section> => {
      const response = await fetch(`/api/projects/${projectId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data: SectionResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to create section");
      }

      setSections((prev) => [...prev, data.section]);
      return data.section;
    },
    [projectId],
  );

  const updateSection = useCallback(
    async (sectionId: string, name: string): Promise<Section> => {
      const response = await fetch(`/api/projects/${projectId}/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data: SectionResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to update section");
      }

      setSections((prev) => prev.map((s) => (s.id === sectionId ? data.section : s)));
      return data.section;
    },
    [projectId],
  );

  const deleteSection = useCallback(
    async (sectionId: string) => {
      const response = await fetch(`/api/projects/${projectId}/sections/${sectionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete section");
      }

      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    },
    [projectId],
  );

  const reorderSections = useCallback(
    async (sectionIds: string[]) => {
      const previousSections = [...sections];

      setSections((prev) => {
        const sectionMap = new Map(prev.map((s) => [s.id, s]));
        return sectionIds
          .map((id, index) => {
            const section = sectionMap.get(id);
            if (!section) return null;
            return { ...section, position: index };
          })
          .filter((s): s is Section => s !== null);
      });

      try {
        const response = await fetch(`/api/projects/${projectId}/sections/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionIds }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to reorder sections");
        }

        setSections(data.sections);
      } catch (err) {
        setSections(previousSections);
        throw err;
      }
    },
    [projectId, sections],
  );

  return {
    sections,
    loading,
    error,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    refetch: fetchSections,
  };
}
