import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { CreateTaskData, Tag, TaskPriority } from "../hooks/use-tasks";
import { PrioritySelect } from "./priority-select";
import { TagSelect } from "./tag-select";

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTaskData) => Promise<void>;
  tags: Tag[];
  sectionId?: string | null;
}

export function TaskCreateModal({
  open,
  onOpenChange,
  onSubmit,
  tags,
  sectionId,
}: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NONE");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("NONE");
    setSelectedTagIds([]);
    setError(null);
    setLoading(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setError("Task title is required");
        return;
      }

      try {
        setError(null);
        setLoading(true);

        const data: CreateTaskData = {
          title: trimmedTitle,
          sectionId,
        };

        if (description.trim()) {
          data.description = description.trim();
        }

        if (dueDate) {
          data.dueDate = new Date(dueDate);
        }

        if (priority !== "NONE") {
          data.priority = priority;
        }

        if (selectedTagIds.length > 0) {
          data.tagIds = selectedTagIds;
        }

        await onSubmit(data);
        handleOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");
      } finally {
        setLoading(false);
      }
    },
    [title, description, dueDate, priority, selectedTagIds, sectionId, onSubmit, handleOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid gap-1.5">
              <label htmlFor="task-title" className="font-medium text-primary text-sm">
                Title
              </label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                autoFocus
                disabled={loading}
              />
              {error && <p className="text-sm text-urgent">{error}</p>}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="task-description" className="font-medium text-primary text-sm">
                Description
              </label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (supports markdown)"
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="task-due-date" className="font-medium text-primary text-sm">
                  Due date
                </label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="font-medium text-primary text-sm">Priority</label>
                <PrioritySelect value={priority} onChange={setPriority} disabled={loading} />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="font-medium text-primary text-sm">Tags</label>
              <TagSelect
                tags={tags}
                selectedIds={selectedTagIds}
                onChange={setSelectedTagIds}
                disabled={loading}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="filled" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
