import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  CommandLineIcon,
  LinkIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Link, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/components/ui/cn";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/toast";
import { useAuth } from "~/platform/auth/use-auth";

type SettingsSection = "profile" | "preferences" | "shortcuts" | "data" | "accounts";

const sections = [
  { id: "profile" as const, label: "Profile", icon: UserCircleIcon },
  { id: "preferences" as const, label: "Preferences", icon: AdjustmentsHorizontalIcon },
  { id: "shortcuts" as const, label: "Keyboard Shortcuts", icon: CommandLineIcon },
  { id: "data" as const, label: "Data", icon: ArrowDownTrayIcon },
  { id: "accounts" as const, label: "Connected Accounts", icon: LinkIcon },
];

function ProfileSection() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user?.name !== undefined) {
      setName(user.name ?? "");
    }
  }, [user?.name]);

  useEffect(() => {
    setHasChanges(name !== (user?.name ?? ""));
  }, [name, user?.name]);

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      await refetch();
      setHasChanges(false);
      toast({ title: "Profile updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to update profile",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>Manage your personal information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-16 w-16 rounded-full" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-secondary">
              <UserCircleIcon className="h-10 w-10" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-primary text-sm">{user?.name || "No name set"}</p>
            <p className="text-secondary text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="display-name" className="font-medium text-primary text-sm">
            Display name
          </label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium text-primary text-sm">Email</label>
          <Input value={user?.email ?? ""} disabled />
          <p className="text-secondary text-xs">Email is managed by your connected account.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="filled" onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {hasChanges && (
            <Button variant="secondary" onClick={() => setName(user?.name ?? "")} disabled={saving}>
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
        <CardDescription>Customize your experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="font-medium text-primary text-sm">Default view</label>
          <p className="text-secondary text-sm">Choose your preferred task view.</p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1">
              List
            </Button>
            <Button variant="secondary" className="flex-1">
              Kanban
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-medium text-primary text-sm">Theme</label>
          <p className="text-secondary text-sm">Select your preferred color scheme.</p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1">
              System
            </Button>
            <Button variant="secondary" className="flex-1">
              Light
            </Button>
            <Button variant="secondary" className="flex-1">
              Dark
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KeyboardShortcutsSection() {
  const shortcuts = [
    { keys: ["⌘", "K"], description: "Open command palette" },
    { keys: ["⌘", "N"], description: "New task" },
    { keys: ["⌘", "⇧", "N"], description: "New project" },
    { keys: ["Esc"], description: "Close modal / deselect" },
    { keys: ["↑", "↓"], description: "Navigate task list" },
    { keys: ["Enter"], description: "Open selected task" },
    { keys: ["Space"], description: "Toggle task complete" },
    { keys: ["E"], description: "Edit selected task" },
    { keys: ["D"], description: "Set due date" },
    { keys: ["P"], description: "Set priority" },
    { keys: ["T"], description: "Add tags" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
        <CardDescription>Quick actions for power users.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between py-1.5">
              <span className="text-primary text-sm">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="min-w-[24px] rounded border border-border bg-surface px-1.5 py-0.5 text-center font-mono text-secondary text-xs"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DataSection() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch("/api/export");

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `todo-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Data exported successfully", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to export data",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const response = await fetch("/api/me", { method: "DELETE" });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      await logout();
      window.location.href = "/login";
    } catch (err) {
      toast({
        title: "Failed to delete account",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Data</CardTitle>
          <CardDescription>Download all your data as JSON.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
            <ArrowDownTrayIcon className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export all data"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-urgent">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="gap-2">
            <TrashIcon className="h-4 w-4" />
            Delete account
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete account?"
        description="This will permanently delete your account, all projects, tasks, and data. This action cannot be undone."
        confirmLabel="Delete account"
        variant="destructive"
        onConfirm={handleDeleteAccount}
        loading={deleting}
      />
    </>
  );
}

interface Account {
  id: string;
  provider: "GOOGLE" | "GITHUB";
  createdAt: string;
}

function ConnectedAccountsSection() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/accounts");

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      setAccounts(data.accounts ?? []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const providerLabels: Record<string, { name: string; icon: string }> = {
    GOOGLE: { name: "Google", icon: "G" },
    GITHUB: { name: "GitHub", icon: "GH" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connected Accounts</CardTitle>
        <CardDescription>Manage your linked authentication providers.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-secondary text-sm">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="text-secondary text-sm">No connected accounts.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const provider = providerLabels[account.provider] ?? {
                name: account.provider,
                icon: "?",
              };
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-background font-medium text-primary text-sm">
                      {provider.icon}
                    </div>
                    <div>
                      <p className="font-medium text-primary text-sm">{provider.name}</p>
                      <p className="text-secondary text-xs">
                        Connected {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <p className="font-medium text-primary text-sm">Connect another account</p>
          <div className="flex gap-2">
            <a
              href="/auth/google"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-border bg-background px-3 py-2 font-medium text-primary text-sm transition-colors hover:bg-surface"
            >
              Google
            </a>
            <a
              href="/auth/github"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-border bg-background px-3 py-2 font-medium text-primary text-sm transition-colors hover:bg-surface"
            >
              GitHub
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Settings() {
  const search = useSearch({ from: "/settings" });
  const currentSection = (search.section as SettingsSection) || "profile";

  const renderSection = () => {
    switch (currentSection) {
      case "profile":
        return <ProfileSection />;
      case "preferences":
        return <PreferencesSection />;
      case "shortcuts":
        return <KeyboardShortcutsSection />;
      case "data":
        return <DataSection />;
      case "accounts":
        return <ConnectedAccountsSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="flex h-full">
      <nav className="w-56 shrink-0 border-border border-r p-4">
        <h1 className="mb-4 font-semibold text-lg text-primary">Settings</h1>
        <ul className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            return (
              <li key={section.id}>
                <Link
                  to="/settings"
                  search={{ section: section.id }}
                  className={cn(
                    "flex items-center gap-3 rounded px-3 py-2 font-medium text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                    isActive
                      ? "bg-surface text-primary"
                      : "text-secondary hover:bg-surface hover:text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">{renderSection()}</div>
      </main>
    </div>
  );
}
