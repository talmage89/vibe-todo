import {
  CalendarDaysIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  FolderIcon,
  HashtagIcon,
  InboxIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link, useRouterState } from "@tanstack/react-router";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/cn";

interface Project {
  id: string;
  name: string;
  color: string | null;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  onAddTask?: () => void;
  onAddProject?: () => void;
}

const navItems = [
  { path: "/", label: "Inbox", icon: InboxIcon },
  { path: "/today", label: "Today", icon: CalendarIcon },
  { path: "/upcoming", label: "Upcoming", icon: CalendarDaysIcon },
] as const;

export const Sidebar = ({
  isOpen,
  onClose,
  projects = [],
  onAddTask,
  onAddProject,
}: SidebarProps) => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  // Build flat list of focusable items for keyboard navigation
  const getFocusableItems = useCallback(() => {
    const items: { type: "nav" | "project" | "action" | "settings"; id: string }[] = [];

    // Quick actions
    if (onAddTask) items.push({ type: "action", id: "add-task" });
    if (onAddProject) items.push({ type: "action", id: "add-project" });

    // Navigation items
    for (const item of navItems) {
      items.push({ type: "nav", id: item.path });
    }

    // Projects header toggle
    items.push({ type: "action", id: "projects-toggle" });

    // Project items (only if expanded)
    if (projectsExpanded) {
      for (const project of projects) {
        items.push({ type: "project", id: project.id });
      }
    }

    // Settings
    items.push({ type: "settings", id: "settings" });

    return items;
  }, [projects, projectsExpanded, onAddTask, onAddProject]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const items = getFocusableItems();

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const nextIndex = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(nextIndex);
          itemRefs.current[nextIndex]?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : items.length - 1;
          setFocusedIndex(prevIndex);
          itemRefs.current[prevIndex]?.focus();
          break;
        }
        case "Home": {
          e.preventDefault();
          setFocusedIndex(0);
          itemRefs.current[0]?.focus();
          break;
        }
        case "End": {
          e.preventDefault();
          const lastIndex = items.length - 1;
          setFocusedIndex(lastIndex);
          itemRefs.current[lastIndex]?.focus();
          break;
        }
        case "Escape": {
          onClose();
          break;
        }
      }
    },
    [focusedIndex, getFocusableItems, onClose],
  );

  // Reset focus index when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Store ref at given index
  const setItemRef = useCallback(
    (index: number, el: HTMLAnchorElement | HTMLButtonElement | null) => {
      itemRefs.current[index] = el;
    },
    [],
  );

  let refIndex = 0;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary/20 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-border border-r bg-surface transition-transform duration-150 ease-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo/Brand */}
        <div className="flex h-14 items-center justify-between border-border border-b px-4">
          <Link to="/" className="font-semibold text-lg text-primary">
            Todo
          </Link>
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto p-3"
          onKeyDown={handleKeyDown}
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Quick actions */}
          {(onAddTask || onAddProject) && (
            <div className="mb-4 flex gap-2">
              {onAddTask && (
                <Button
                  ref={(el) => setItemRef(refIndex++, el)}
                  variant="outline"
                  size="sm"
                  onClick={onAddTask}
                  className="flex-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Task
                </Button>
              )}
              {onAddProject && (
                <Button
                  ref={(el) => setItemRef(refIndex++, el)}
                  variant="outline"
                  size="sm"
                  onClick={onAddProject}
                  className="flex-1"
                >
                  <FolderIcon className="h-4 w-4" />
                  Project
                </Button>
              )}
            </div>
          )}

          {/* Main navigation */}
          <ul className="space-y-1" role="list">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;
              const currentRefIndex = refIndex++;
              return (
                <li key={item.path}>
                  <Link
                    ref={(el) => setItemRef(currentRefIndex, el)}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded px-3 py-2 font-medium text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                      isActive
                        ? "bg-background text-primary"
                        : "text-secondary hover:bg-background hover:text-primary",
                    )}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Projects section */}
          <div className="mt-6">
            <button
              ref={(el) => setItemRef(refIndex++, el)}
              type="button"
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className={cn(
                "flex w-full items-center justify-between rounded px-3 py-1.5 font-medium text-secondary text-xs uppercase tracking-wider transition-colors",
                "hover:bg-background hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              )}
              aria-expanded={projectsExpanded}
              aria-controls="projects-list"
            >
              <span>Projects</span>
              {projectsExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>

            {projectsExpanded && (
              <ul id="projects-list" className="mt-1 space-y-1" role="list">
                {projects.length === 0 ? (
                  <li className="px-3 py-2 text-secondary text-sm">No projects yet</li>
                ) : (
                  projects.map((project) => {
                    const isActive = currentPath === `/projects/${project.id}`;
                    const currentRefIndex = refIndex++;
                    return (
                      <li key={project.id}>
                        <Link
                          ref={(el) => setItemRef(currentRefIndex, el)}
                          to={`/projects/${project.id}`}
                          className={cn(
                            "flex items-center gap-3 rounded px-3 py-2 font-medium text-sm transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                            isActive
                              ? "bg-background text-primary"
                              : "text-secondary hover:bg-background hover:text-primary",
                          )}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {project.color ? (
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: project.color }}
                              aria-hidden="true"
                            />
                          ) : (
                            <HashtagIcon className="h-5 w-5" />
                          )}
                          {project.name}
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="border-border border-t p-3">
          <Link
            ref={(el) => setItemRef(refIndex++, el)}
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded px-3 py-2 font-medium text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              currentPath === "/settings"
                ? "bg-background text-primary"
                : "text-secondary hover:bg-background hover:text-primary",
            )}
          >
            <Cog6ToothIcon className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
};
