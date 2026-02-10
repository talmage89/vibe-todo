import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "~/components/ui/cn";
import type { Tag } from "../types";

interface TagChipProps {
  tag: Tag;
  onRemove?: (tagId: string) => void;
  className?: string;
}

export function TagChip({ tag, onRemove, className }: TagChipProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs", className)}
      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.id);
          }}
          className="rounded hover:bg-black/10"
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
