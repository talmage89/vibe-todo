import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/toast";
import { TAG_COLORS } from "~/features/tasks/constants";
import type { Tag } from "../types";

interface TagManagerProps {
  tags: Tag[];
  loading: boolean;
  onCreateTag: (name: string, color: string) => Promise<Tag>;
  onUpdateTag: (tagId: string, updates: Partial<Pick<Tag, "name" | "color">>) => Promise<Tag>;
  onDeleteTag: (tagId: string) => Promise<void>;
}

export function TagManager({
  tags,
  loading,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: TagManagerProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState<string>(TAG_COLORS[0].value);
  const [createLoading, setCreateLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
    setCreateName("");
    setCreateColor(TAG_COLORS[0].value);
    setTimeout(() => createInputRef.current?.focus(), 0);
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setCreateName("");
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmed = createName.trim();
    if (!trimmed) return;

    try {
      setCreateLoading(true);
      await onCreateTag(trimmed, createColor);
      setIsCreating(false);
      setCreateName("");
      toast({ title: "Tag created", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to create tag",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  }, [createName, createColor, onCreateTag, toast]);

  const handleCreateKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreate();
      } else if (e.key === "Escape") {
        handleCancelCreate();
      }
    },
    [handleCreate, handleCancelCreate],
  );

  const handleStartEdit = useCallback((tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;

    const tag = tags.find((t) => t.id === editingId);
    if (tag && trimmed === tag.name && editColor === tag.color) {
      handleCancelEdit();
      return;
    }

    try {
      setEditLoading(true);
      const updates: Partial<Pick<Tag, "name" | "color">> = {};
      if (tag && trimmed !== tag.name) updates.name = trimmed;
      if (tag && editColor !== tag.color) updates.color = editColor;
      await onUpdateTag(editingId, updates);
      handleCancelEdit();
      toast({ title: "Tag updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to update tag",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
    } finally {
      setEditLoading(false);
    }
  }, [editingId, editName, editColor, tags, onUpdateTag, handleCancelEdit, toast]);

  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      setDeleteLoading(true);
      await onDeleteTag(deleteId);
      setDeleteId(null);
      toast({ title: "Tag deleted", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to delete tag",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, onDeleteTag, toast]);

  const deleteTag = tags.find((t) => t.id === deleteId);

  if (loading) {
    return <p className="text-secondary text-sm">Loading tags...</p>;
  }

  return (
    <div className="space-y-3">
      {tags.length === 0 && !isCreating && (
        <p className="text-secondary text-sm">No tags yet. Create one to get started.</p>
      )}

      {tags.map((tag) =>
        editingId === tag.id ? (
          <div key={tag.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                ref={editInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleEditKeyDown}
                disabled={editLoading}
                placeholder="Tag name"
                className="h-8 flex-1 text-sm"
              />
              <Button
                variant="filled"
                size="sm"
                onClick={handleSaveEdit}
                disabled={editLoading || !editName.trim()}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelEdit}
                disabled={editLoading}
              >
                Cancel
              </Button>
            </div>
            <TagColorPicker value={editColor} onChange={setEditColor} />
          </div>
        ) : (
          <div
            key={tag.id}
            className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-surface"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span className="flex-1 text-primary text-sm">{tag.name}</span>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
              onClick={() => handleStartEdit(tag)}
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
              onClick={() => setDeleteId(tag.id)}
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      )}

      {isCreating ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={createInputRef}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              disabled={createLoading}
              placeholder="Tag name"
              className="h-8 flex-1 text-sm"
            />
            <Button
              variant="filled"
              size="sm"
              onClick={handleCreate}
              disabled={createLoading || !createName.trim()}
            >
              Add
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancelCreate}
              disabled={createLoading}
            >
              Cancel
            </Button>
          </div>
          <TagColorPicker value={createColor} onChange={setCreateColor} />
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={handleStartCreate} className="gap-1.5">
          <PlusIcon className="h-3.5 w-3.5" />
          Add tag
        </Button>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete tag?"
        description={`This will remove "${deleteTag?.name ?? ""}" from all tasks. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}

function TagColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAG_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={`h-6 w-6 rounded-full transition-all ${
            value === color.value ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
          }`}
          style={{ backgroundColor: color.value }}
          aria-label={color.name}
          aria-pressed={value === color.value}
        />
      ))}
    </div>
  );
}
