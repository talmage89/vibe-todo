import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { KeyboardShortcut } from "./keyboard-shortcut";

const SHORTCUTS = [
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

export function ShortcutsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
        <CardDescription>Quick actions for power users.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <KeyboardShortcut
              key={shortcut.description}
              keys={shortcut.keys}
              description={shortcut.description}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
