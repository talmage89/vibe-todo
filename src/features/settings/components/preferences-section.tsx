import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export function PreferencesSection() {
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
