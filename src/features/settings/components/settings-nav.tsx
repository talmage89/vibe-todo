import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  CommandLineIcon,
  LinkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Link } from "@tanstack/react-router";
import { cn } from "~/components/ui/cn";
import type { SettingsSection } from "../types";

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: typeof UserCircleIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile", label: "Profile", icon: UserCircleIcon },
  { id: "preferences", label: "Preferences", icon: AdjustmentsHorizontalIcon },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: CommandLineIcon },
  { id: "data", label: "Data", icon: ArrowDownTrayIcon },
  { id: "accounts", label: "Connected Accounts", icon: LinkIcon },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        to="/settings"
        search={{ section: item.id }}
        className={cn(
          "flex items-center gap-3 rounded px-3 py-2 font-medium text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          isActive
            ? "bg-surface text-primary"
            : "text-secondary hover:bg-surface hover:text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </Link>
    </li>
  );
}

interface SettingsNavProps {
  currentSection: SettingsSection;
}

export function SettingsNav({ currentSection }: SettingsNavProps) {
  return (
    <nav className="w-56 shrink-0 border-border border-r p-4">
      <h1 className="mb-4 font-semibold text-lg text-primary">Settings</h1>
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.id} item={item} isActive={currentSection === item.id} />
        ))}
      </ul>
    </nav>
  );
}
