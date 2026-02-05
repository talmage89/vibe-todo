import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/toast";
import { useAuth } from "~/platform/auth/use-auth";
import { DefaultView, Theme } from "~/platform/db/generated";
import { useTheme } from "~/platform/theme/use-theme";

interface Project {
  id: string;
  name: string;
}

const themeOptions: { value: Theme; label: string }[] = [
  { value: Theme.SYSTEM, label: "System" },
  { value: Theme.LIGHT, label: "Light" },
  { value: Theme.DARK, label: "Dark" },
];

const viewOptions: { value: DefaultView; label: string }[] = [
  { value: DefaultView.LIST, label: "List" },
  { value: DefaultView.KANBAN, label: "Kanban" },
];

export function PreferencesSection() {
  const { user, refetch } = useAuth();
  const { setTheme: setClientTheme } = useTheme();
  const { toast } = useToast();

  const [theme, setTheme] = useState<Theme>(user?.theme ?? Theme.SYSTEM);
  const [defaultView, setDefaultView] = useState<DefaultView>(
    user?.defaultView ?? DefaultView.LIST,
  );
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(
    user?.defaultProjectId ?? null,
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setTheme(user.theme ?? Theme.SYSTEM);
      setDefaultView(user.defaultView ?? DefaultView.LIST);
      setDefaultProjectId(user.defaultProjectId ?? null);
    }
  }, [user]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects ?? []);
        }
      } catch {
        // Silently fail, projects are optional
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const changed =
      theme !== (user?.theme ?? Theme.SYSTEM) ||
      defaultView !== (user?.defaultView ?? DefaultView.LIST) ||
      defaultProjectId !== (user?.defaultProjectId ?? null);
    setHasChanges(changed);
  }, [theme, defaultView, defaultProjectId, user]);

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          defaultView,
          defaultProjectId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update preferences");
      }

      // Sync theme with client-side theme provider
      setClientTheme(theme.toLowerCase() as "light" | "dark" | "system");

      await refetch();
      setHasChanges(false);
      toast({ title: "Preferences updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to update preferences",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTheme(user?.theme ?? Theme.SYSTEM);
    setDefaultView(user?.defaultView ?? DefaultView.LIST);
    setDefaultProjectId(user?.defaultProjectId ?? null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
        <CardDescription>Customize your experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="font-medium text-primary text-sm">Default view</label>
          <p className="text-secondary text-sm">Choose your preferred task view.</p>
          <div className="flex gap-2 pt-1">
            {viewOptions.map((option) => (
              <Button
                key={option.value}
                variant={defaultView === option.value ? "outline" : "secondary"}
                className="flex-1"
                onClick={() => setDefaultView(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-medium text-primary text-sm">Theme</label>
          <p className="text-secondary text-sm">Select your preferred color scheme.</p>
          <div className="flex gap-2 pt-1">
            {themeOptions.map((option) => (
              <Button
                key={option.value}
                variant={theme === option.value ? "outline" : "secondary"}
                className="flex-1"
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-medium text-primary text-sm">Default project</label>
          <p className="text-secondary text-sm">Select the project used for quick task capture.</p>
          <Select
            value={defaultProjectId ?? "none"}
            onValueChange={(value) => setDefaultProjectId(value === "none" ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="filled" onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {hasChanges && (
            <Button variant="secondary" onClick={handleReset} disabled={saving}>
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
