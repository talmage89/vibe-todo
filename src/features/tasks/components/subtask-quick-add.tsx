import { PlusIcon } from "@heroicons/react/24/outline";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import { Input } from "~/components/ui/input";

interface SubtaskQuickAddProps {
  onAdd: (title: string) => Promise<void>;
  disabled?: boolean;
}

export function SubtaskQuickAdd({ onAdd, disabled = false }: SubtaskQuickAddProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartAdd = useCallback(() => {
    if (disabled) return;
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setIsAdding(false);
      setTitle("");
      return;
    }

    try {
      setLoading(true);
      await onAdd(trimmedTitle);
      setTitle("");
      inputRef.current?.focus();
    } catch {
      // Keep the input open on error
    } finally {
      setLoading(false);
    }
  }, [title, onAdd]);

  const handleCancel = useCallback(() => {
    setIsAdding(false);
    setTitle("");
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSubmit, handleCancel],
  );

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={handleStartAdd}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded px-1 py-1 text-secondary text-sm transition-colors hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusIcon className="h-4 w-4" />
        Add subtask
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <PlusIcon className="h-4 w-4 shrink-0 text-secondary" />
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleCancel}
        disabled={loading}
        placeholder="Subtask title"
        className="h-6 flex-1 px-1 py-0 text-sm"
      />
    </div>
  );
}
