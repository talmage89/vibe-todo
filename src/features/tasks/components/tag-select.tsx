import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { cn } from "~/components/ui/cn";
import type { Tag } from "../hooks/use-tasks";

interface TagSelectProps {
  tags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function TagSelect({ tags, selectedIds, onChange, disabled }: TagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = useCallback(
    (tagId: string) => {
      if (disabled) return;
      const isSelected = selectedIds.includes(tagId);
      if (isSelected) {
        onChange(selectedIds.filter((id) => id !== tagId));
      } else {
        onChange([...selectedIds, tagId]);
      }
    },
    [selectedIds, onChange, disabled],
  );

  const removeTag = useCallback(
    (tagId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      onChange(selectedIds.filter((id) => id !== tagId));
    },
    [selectedIds, onChange, disabled],
  );

  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id));

  if (tags.length === 0) {
    return (
      <div className="rounded border border-border px-3 py-2 text-secondary text-sm">
        No tags available
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1 rounded border border-border bg-background px-3 py-1.5 text-left text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={(e) => removeTag(tag.id, e)}
                className="rounded hover:bg-black/10"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-secondary">Select tags</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-border bg-background p-1 shadow-sm">
            {tags.map((tag) => {
              const isSelected = selectedIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "relative flex w-full items-center rounded py-2 pr-8 pl-2 text-sm outline-none transition-colors",
                    "hover:bg-surface",
                  )}
                >
                  <span
                    className="mr-2 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-primary">{tag.name}</span>
                  {isSelected && (
                    <span className="absolute right-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
