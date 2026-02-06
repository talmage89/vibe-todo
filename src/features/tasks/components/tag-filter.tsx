import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { cn } from "~/components/ui/cn";
import type { Tag } from "../hooks/use-task";

interface TagFilterProps {
  tags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagFilter({ tags, selectedTagIds, onChange }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = useCallback(
    (tagId: string) => {
      if (selectedTagIds.includes(tagId)) {
        onChange(selectedTagIds.filter((id) => id !== tagId));
      } else {
        onChange([...selectedTagIds, tagId]);
      }
    },
    [selectedTagIds, onChange],
  );

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  if (tags.length === 0) return null;

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
          selectedTagIds.length > 0
            ? "bg-accent/10 text-accent"
            : "text-secondary hover:bg-surface hover:text-primary",
        )}
      >
        <FunnelIcon className="h-3.5 w-3.5" />
        Filter
        {selectedTagIds.length > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-[10px] text-white">
            {selectedTagIds.length}
          </span>
        )}
      </button>

      {selectedTagIds.length > 0 && (
        <>
          {selectedTagIds.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="rounded hover:bg-black/10"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={clearAll}
            className="text-secondary text-xs hover:text-primary"
          >
            Clear
          </button>
        </>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 min-w-[180px] rounded-md border border-border bg-background p-1 shadow-sm">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
                    "hover:bg-surface",
                    isSelected && "bg-surface",
                  )}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-left text-primary">{tag.name}</span>
                  {isSelected && <span className="text-accent text-xs">&#10003;</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
