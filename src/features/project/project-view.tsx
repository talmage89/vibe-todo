import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { SectionList } from "~/features/sections/components/section-list";
import { useSections } from "~/features/sections/hooks/use-sections";
import { TagFilter } from "~/features/tasks/components/tag-filter";
import { useTags } from "~/features/tasks/hooks/use-tags";

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

  const {
    sections,
    loading: sectionsLoading,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
  } = useSections(projectId);

  const { tags } = useTags(projectId);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);

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
      <header className="border-border border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {project.color && (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
                aria-hidden="true"
              />
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
        </div>
        {tags.length > 0 && (
          <div className="border-border border-t px-6 py-2">
            <TagFilter tags={tags} selectedTagIds={filterTagIds} onChange={setFilterTagIds} />
          </div>
        )}
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        {sectionsLoading ? (
          <p className="text-secondary text-sm">Loading sections...</p>
        ) : (
          <SectionList
            sections={sections}
            onCreateSection={createSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            onReorderSections={reorderSections}
          />
        )}
      </main>
    </div>
  );
}
