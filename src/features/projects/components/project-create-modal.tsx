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
import { ColorPicker } from "./color-picker";

interface ProjectCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; color?: string }) => Promise<void>;
}

export const ProjectCreateModal = ({ open, onOpenChange, onSubmit }: ProjectCreateModalProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setName("");
    setColor(undefined);
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

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Project name is required");
        return;
      }

      try {
        setError(null);
        setLoading(true);
        await onSubmit({ name: trimmedName, color });
        handleOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create project");
      } finally {
        setLoading(false);
      }
    },
    [name, color, onSubmit, handleOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid gap-1.5">
              <label htmlFor="project-name" className="font-medium text-primary text-sm">
                Name
              </label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                autoFocus
                disabled={loading}
              />
              {error && <p className="text-sm text-urgent">{error}</p>}
            </div>
            <div className="grid gap-1.5">
              <label className="font-medium text-primary text-sm">Color</label>
              <ColorPicker value={color} onChange={setColor} />
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
};
