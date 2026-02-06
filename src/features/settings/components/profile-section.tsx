import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/toast";
import { useAuth } from "~/platform/auth/use-auth";
import { api } from "~/platform/query/api";

export function ProfileSection() {
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
      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() || null }),
      });

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
