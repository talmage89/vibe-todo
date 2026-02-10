import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface TaskQuickAddProps {
  onSubmit: (title: string) => Promise<void>;
  sectionId?: string | null;
}

export function TaskQuickAdd({ onSubmit }: TaskQuickAddProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Task title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(trimmedTitle);
      setTitle("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }, [title, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setTitle("");
        setError(null);
      }
    },
    [handleSubmit],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setTitle("");
    setError(null);
  }, []);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsEditing(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex w-full items-center gap-2 rounded px-3 py-2 text-secondary text-sm transition-colors hover:bg-surface hover:text-primary active:opacity-90"
      >
        <PlusIcon className="h-4 w-4" />
        Add task
      </button>
    );
  }

  return (
    <div className="fade-in-0 animate-in rounded border border-border bg-background p-3 duration-100">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Task title"
          disabled={loading}
          className="flex-1"
        />
        <Button variant="filled" size="sm" onClick={handleSubmit} disabled={loading}>
          {loading ? "..." : "Add"}
        </Button>
        <Button variant="secondary" size="icon" onClick={handleCancel} disabled={loading}>
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="mt-1.5 text-sm text-urgent">{error}</p>}
    </div>
  );
}
