import {
  CalendarDaysIcon,
  CalendarIcon,
  Cog6ToothIcon,
  InboxIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/cn";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { path: "/", label: "Inbox", icon: InboxIcon },
    { path: "/today", label: "Today", icon: CalendarIcon },
    { path: "/upcoming", label: "Upcoming", icon: CalendarDaysIcon },
  ];

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
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded px-3 py-2 font-medium text-sm transition-colors",
                      isActive
                        ? "bg-background text-primary"
                        : "text-secondary hover:bg-background hover:text-primary",
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Projects section placeholder */}
          <div className="mt-6">
            <h3 className="mb-2 px-3 font-medium text-secondary text-xs uppercase tracking-wider">
              Projects
            </h3>
            <p className="px-3 text-secondary text-sm">No projects yet</p>
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="border-border border-t p-3">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded px-3 py-2 font-medium text-secondary text-sm transition-colors hover:bg-background hover:text-primary"
          >
            <Cog6ToothIcon className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
};
