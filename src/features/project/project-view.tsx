import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

interface Project {
  id: string;
  name: string;
  color: string | null;
}

export function ProjectView() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project");
      }

      setProject(data.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-secondary text-sm">{error}</p>
        <Button variant="secondary" onClick={() => navigate({ to: "/" })}>
          Go back
        </Button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-border border-b px-6 py-4">
        <div className="flex items-center gap-3">
          {project.color && (
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
          )}
          <h1 className="font-semibold text-lg text-primary">{project.name}</h1>
        </div>
        <Link
          to="/project/$projectId/settings"
          params={{ projectId }}
          className="rounded p-1.5 text-secondary transition-colors hover:bg-surface hover:text-primary"
          title="Project settings"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <p className="text-secondary text-sm">No tasks yet</p>
      </main>
    </div>
  );
}
