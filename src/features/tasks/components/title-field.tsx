import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";

interface TitleFieldProps {
  value: string;
  onSave: (value: string) => Promise<unknown>;
}

export function TitleField({ value, onSave }: TitleFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(value);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value]);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === value) {
      setIsEditing(false);
      setEditValue(value);
      return;
    }

    try {
      setSaving(true);
      await onSave(trimmed);
      setIsEditing(false);
    } catch {
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(value);
      }
    },
    [handleSave, value],
  );

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={saving}
        className="font-semibold text-lg"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className="w-full rounded px-3 py-2 text-left font-semibold text-lg text-primary transition-colors hover:bg-surface"
    >
      {value}
    </button>
  );
}
