import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/platform/auth/use-auth";
import { type Theme, useTheme } from "~/platform/theme/use-theme";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="flex h-14 items-center justify-between border-border border-b bg-background px-4">
      {/* Left section: menu button (mobile) + search placeholder */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-5 w-5" />
        </Button>

        {/* Search button - placeholder for future command palette */}
        <Button variant="outline" className="flex items-center gap-2 text-secondary">
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded bg-surface px-1.5 py-0.5 font-medium text-secondary text-xs sm:inline">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Right section: user menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className="flex items-center gap-2 px-1.5"
            aria-label="User menu"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-medium text-sm text-white">
                {user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "?"}
              </div>
            )}
            <ChevronDownIcon className="h-4 w-4 text-secondary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* User info */}
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="truncate font-medium text-primary text-sm">
              {user?.name ?? "User"}
            </span>
            <span className="truncate font-normal text-secondary text-xs">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Theme selection */}
          <DropdownMenuLabel className="px-3 py-1.5 font-medium text-secondary text-xs">
            Theme
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
            <DropdownMenuRadioItem value="light">
              <SunIcon className="h-4 w-4 text-secondary" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <MoonIcon className="h-4 w-4 text-secondary" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <ComputerDesktopIcon className="h-4 w-4 text-secondary" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />

          {/* Menu items */}
          <DropdownMenuItem asChild>
            <a href="/settings" className="flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4 text-secondary" />
              Settings
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
            <ArrowRightStartOnRectangleIcon className="h-4 w-4 text-secondary" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
