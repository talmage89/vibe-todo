import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/toast";
import { ColorPicker } from "~/features/projects/components/color-picker";
import { TagManager } from "~/features/tasks/components/tag-manager";
import { useTags } from "~/features/tasks/hooks/use-tags";
import { api } from "~/platform/query/api";
import { queryKeys } from "~/platform/query/query-keys";
import type { Project } from "../types";

interface ProjectResponse {
  project: Project;
}

export function ProjectSettings() {
  const { projectId } = useParams({ from: "/project/$projectId/settings" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading: loading,
    error: projectError,
  } = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => api<ProjectResponse>(`/api/projects/${projectId}`),
    select: (data) => data.project,
  });

  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { tags, loading: tagsLoading, createTag, updateTag, deleteTag } = useTags(projectId);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color);
    }
  }, [project]);

  useEffect(() => {
    if (project) {
      const nameChanged = name !== project.name;
      const colorChanged = color !== project.color;
      setHasChanges(nameChanged || colorChanged);
    }
  }, [name, color, project]);

  const saveMutation = useMutation({
    mutationFn: (input: { name: string; color: string | null }) =>
      api<ProjectResponse>(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      setHasChanges(false);
      toast({ title: "Project updated", variant: "success" });
    },
    onError: (err) => {
      toast({
        title: "Failed to update project",
        description: err.message,
        variant: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api<void>(`/api/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(projectId) });
      toast({ title: "Project deleted", variant: "success" });
      navigate({ to: "/" });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete project",
        description: err.message,
        variant: "error",
      });
      setDeleteDialogOpen(false);
    },
  });

  const handleSave = () => {
    if (!hasChanges || !name.trim()) return;
    saveMutation.mutate({ name: name.trim(), color });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
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

  if (projectError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-secondary text-sm">{projectError.message}</p>
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
                disabled={!hasChanges || !name.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
              {hasChanges && (
                <Button variant="secondary" onClick={handleReset} disabled={saveMutation.isPending}>
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
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
