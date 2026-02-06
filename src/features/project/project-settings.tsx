import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/toast";
import { ColorPicker } from "~/features/projects/components/color-picker";
import { TagManager } from "~/features/tasks/components/tag-manager";
import { useTags } from "~/features/tasks/hooks/use-tags";

interface Project {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ProjectSettings() {
  const { projectId } = useParams({ from: "/project/$projectId/settings" });
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { tags, loading: tagsLoading, createTag, updateTag, deleteTag } = useTags(projectId);

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
      setName(data.project.name);
      setColor(data.project.color);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project) {
      const nameChanged = name !== project.name;
      const colorChanged = color !== project.color;
      setHasChanges(nameChanged || colorChanged);
    }
  }, [name, color, project]);

  const handleSave = async () => {
    if (!hasChanges || !name.trim()) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update project");
      }

      setProject(data.project);
      setHasChanges(false);
      toast({ title: "Project updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to update project",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete project");
      }

      toast({ title: "Project deleted", variant: "success" });
      navigate({ to: "/" });
    } catch (err) {
      toast({
        title: "Failed to delete project",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleReset = () => {
    if (project) {
      setName(project.name);
      setColor(project.color);
    }
  };

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
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/project/$projectId"
          params={{ projectId }}
          className="rounded p-1.5 text-secondary transition-colors hover:bg-surface hover:text-primary"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-lg text-primary">Project Settings</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Update your project name and color.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="project-name" className="font-medium text-primary text-sm">
                Name
              </label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium text-primary text-sm">Color</label>
              <ColorPicker value={color ?? undefined} onChange={setColor} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="filled"
                onClick={handleSave}
                disabled={!hasChanges || !name.trim() || saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
              {hasChanges && (
                <Button variant="secondary" onClick={handleReset} disabled={saving}>
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
            <CardDescription>Create and manage tags for this project.</CardDescription>
          </CardHeader>
          <CardContent>
            <TagManager
              tags={tags}
              loading={tagsLoading}
              onCreateTag={createTag}
              onUpdateTag={updateTag}
              onDeleteTag={deleteTag}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-urgent">Danger Zone</CardTitle>
            <CardDescription>Permanently delete this project and all of its data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Delete project
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete project?"
        description={`This will permanently delete "${project.name}" and all of its tasks, sections, and tags. This action cannot be undone.`}
        confirmLabel="Delete project"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
