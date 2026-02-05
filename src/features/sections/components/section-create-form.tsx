import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface SectionCreateFormProps {
  onSubmit: (name: string) => Promise<void>;
}

export function SectionCreateForm({ onSubmit }: SectionCreateFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Section name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(trimmedName);
      setName("");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create section");
    } finally {
      setLoading(false);
    }
  }, [name, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setName("");
        setError(null);
      }
    },
    [handleSubmit],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setName("");
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
        className="flex w-full items-center gap-2 rounded px-3 py-2 text-secondary text-sm transition-colors hover:bg-surface hover:text-primary"
      >
        <PlusIcon className="h-4 w-4" />
        Add section
      </button>
    );
  }

  return (
    <div className="rounded border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Section name"
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
