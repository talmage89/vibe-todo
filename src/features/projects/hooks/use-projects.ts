import { useCallback, useEffect, useState } from "react";
import type { Project } from "../types";

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createProject: (data: { name: string; color?: string }) => Promise<Project>;
}

export const useProjects = (): UseProjectsResult => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch projects");
      }

      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (input: { name: string; color?: string }): Promise<Project> => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setProjects((prev) => [...prev, data.project]);
      return data.project;
    },
    [],
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
  };
};
