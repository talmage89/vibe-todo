import {
  ArchiveBoxXMarkIcon,
  FolderOpenIcon,
  InboxIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "./cn";

interface EmptyStateProps {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
  };
  className?: string;
  children?: ReactNode;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) => {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-4 py-12 text-center", className)}
    >
      {Icon && (
        <Icon className="mb-4 h-10 w-10 text-secondary" strokeWidth={1.5} aria-hidden="true" />
      )}
      <h3 className="font-medium text-primary text-sm">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-secondary text-sm">{description}</p>}
      {action && (
        <Button
          variant={action.variant ?? "filled"}
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
};

export const EmptyTasks = ({
  onAddTask,
  className,
}: {
  onAddTask?: () => void;
  className?: string;
}) => {
  return (
    <EmptyState
      icon={InboxIcon}
      title="No tasks"
      description="Create a task to get started"
      action={
        onAddTask
          ? {
              label: "Add task",
              onClick: onAddTask,
            }
          : undefined
      }
      className={className}
    />
  );
};

export const EmptyProjects = ({
  onAddProject,
  className,
}: {
  onAddProject?: () => void;
  className?: string;
}) => {
  return (
    <EmptyState
      icon={FolderOpenIcon}
      title="No projects"
      description="Create a project to organize your tasks"
      action={
        onAddProject
          ? {
              label: "Create project",
              onClick: onAddProject,
            }
          : undefined
      }
      className={className}
    />
  );
};

export const EmptySearchResults = ({
  query,
  onClear,
  className,
}: {
  query?: string;
  onClear?: () => void;
  className?: string;
}) => {
  return (
    <EmptyState
      icon={MagnifyingGlassIcon}
      title="No results found"
      description={query ? `No matches for "${query}"` : "Try adjusting your search"}
      action={
        onClear
          ? {
              label: "Clear search",
              onClick: onClear,
              variant: "secondary",
            }
          : undefined
      }
      className={className}
    />
  );
};

export const EmptyFiltered = ({
  onClearFilters,
  className,
}: {
  onClearFilters?: () => void;
  className?: string;
}) => {
  return (
    <EmptyState
      icon={ArchiveBoxXMarkIcon}
      title="No matching items"
      description="Try adjusting your filters"
      action={
        onClearFilters
          ? {
              label: "Clear filters",
              onClick: onClearFilters,
              variant: "secondary",
            }
          : undefined
      }
      className={className}
    />
  );
};
