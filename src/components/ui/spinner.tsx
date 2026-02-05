import { cn } from "./cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
};

/**
 * Circular loading spinner.
 * Use for indicating loading states.
 */
export const Spinner = ({ size = "md", className, label }: SpinnerProps) => {
  return (
    <div
      className={cn("inline-flex flex-col items-center gap-3", className)}
      role="status"
      aria-label={label ?? "Loading"}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-accent border-t-transparent",
          sizeClasses[size],
        )}
      />
      {label && <span className="text-secondary text-sm">{label}</span>}
    </div>
  );
};

/**
 * Full-page loading state with centered spinner.
 */
export const LoadingPage = ({ label = "Loading..." }: { label?: string }) => {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <Spinner size="md" label={label} />
    </div>
  );
};
