import { cn } from "~/components/ui/cn";

interface SubtaskProgressProps {
  completed: number;
  total: number;
  className?: string;
}

export function SubtaskProgress({ completed, total, className }: SubtaskProgressProps) {
  if (total === 0) return null;

  const isComplete = completed === total;

  return (
    <span
      className={cn("text-xs", isComplete ? "text-accent" : "text-secondary", className)}
      title={`${completed} of ${total} subtasks complete`}
    >
      {completed}/{total}
    </span>
  );
}
