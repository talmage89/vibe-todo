import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "~/components/ui/textarea";

interface DescriptionFieldProps {
  value: string | null;
  onSave: (value: string | null) => Promise<unknown>;
}

export function DescriptionField({ value, onSave }: DescriptionFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value ?? "");
  }, [value]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(value ?? "");
    setTimeout(() => {
      textareaRef.current?.focus();
      autoResize();
    }, 0);
  }, [value, autoResize]);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    const newValue = trimmed || null;

    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(newValue);
      setIsEditing(false);
    } catch {
      setEditValue(value ?? "");
    } finally {
      setSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(value ?? "");
      }
    },
    [value],
  );

  if (isEditing) {
    return (
      <div className="space-y-1.5">
        <label className="font-medium text-secondary text-xs">Description</label>
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={saving}
          placeholder="Add a description..."
          className="resize-none overflow-hidden"
          rows={1}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="font-medium text-secondary text-xs">Description</label>
      <button
        type="button"
        onClick={handleStartEdit}
        className="w-full rounded border border-transparent px-3 py-2 text-left text-sm transition-colors hover:border-border hover:bg-surface"
      >
        {value ? (
          <span className="text-primary">{value}</span>
        ) : (
          <span className="text-secondary">Add a description...</span>
        )}
      </button>
    </div>
  );
}
