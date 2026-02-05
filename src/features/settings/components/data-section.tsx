import { ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { useToast } from "~/components/ui/toast";
import { useAuth } from "~/platform/auth/use-auth";

export function DataSection() {
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
