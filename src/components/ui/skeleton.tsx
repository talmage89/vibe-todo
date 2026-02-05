import { cn } from "./cn";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return <div className={cn("animate-pulse rounded bg-surface", className)} />;
};

export const SkeletonText = ({ className }: SkeletonProps) => {
  return <Skeleton className={cn("h-4 w-full", className)} />;
};

export const SkeletonTaskItem = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2", className)}>
      <Skeleton className="h-4 w-4 shrink-0 rounded" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
};

export const SkeletonTaskList = ({ count = 5, className }: SkeletonProps & { count?: number }) => {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTaskItem key={i} />
      ))}
    </div>
  );
};

export const SkeletonProjectItem = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2", className)}>
      <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
};

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

export const SkeletonCard = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("space-y-3 rounded border border-border bg-background p-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};

export const SkeletonCardGrid = ({ count = 6, className }: SkeletonProps & { count?: number }) => {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const SkeletonSearchResult = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("flex items-start gap-3 px-3 py-2", className)}>
      <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
};

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
