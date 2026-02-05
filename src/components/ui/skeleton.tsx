import { cn } from "./cn";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton element with pulse animation.
 * Use this for custom skeleton shapes.
 */
export const Skeleton = ({ className }: SkeletonProps) => {
  return <div className={cn("animate-pulse rounded bg-surface", className)} />;
};

/**
 * Skeleton for a single line of text.
 */
export const SkeletonText = ({ className }: SkeletonProps) => {
  return <Skeleton className={cn("h-4 w-full", className)} />;
};

/**
 * Skeleton for a task list item.
 * Matches the structure of actual task rows.
 */
export const SkeletonTaskItem = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2", className)}>
      {/* Checkbox placeholder */}
      <Skeleton className="h-4 w-4 shrink-0 rounded" />
      {/* Title placeholder */}
      <Skeleton className="h-4 flex-1" />
      {/* Due date placeholder */}
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
};

/**
 * Skeleton for a task list with multiple items.
 */
export const SkeletonTaskList = ({ count = 5, className }: SkeletonProps & { count?: number }) => {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTaskItem key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for a project list item in the sidebar.
 */
export const SkeletonProjectItem = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2", className)}>
      {/* Color dot placeholder */}
      <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
      {/* Project name placeholder */}
      <Skeleton className="h-4 w-24" />
    </div>
  );
};

/**
 * Skeleton for a project list with multiple items.
 */
export const SkeletonProjectList = ({
  count = 3,
  className,
}: SkeletonProps & { count?: number }) => {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProjectItem key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for a card element.
 * Use for kanban cards or task detail cards.
 */
export const SkeletonCard = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("space-y-3 rounded border border-border bg-background p-3", className)}>
      {/* Title line */}
      <Skeleton className="h-4 w-3/4" />
      {/* Description lines */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      {/* Footer row with metadata */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};

/**
 * Skeleton for a grid of cards.
 */
export const SkeletonCardGrid = ({ count = 6, className }: SkeletonProps & { count?: number }) => {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for a search result item.
 */
export const SkeletonSearchResult = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("flex items-start gap-3 px-3 py-2", className)}>
      {/* Icon placeholder */}
      <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded" />
      <div className="flex-1 space-y-1.5">
        {/* Title */}
        <Skeleton className="h-4 w-2/3" />
        {/* Breadcrumb/path */}
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
};

/**
 * Skeleton for a search results list.
 */
export const SkeletonSearchResults = ({
  count = 4,
  className,
}: SkeletonProps & { count?: number }) => {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonSearchResult key={i} />
      ))}
    </div>
  );
};
