import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { KeyboardShortcut } from "./keyboard-shortcut";

interface ShortcutCategory {
  name: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    name: "Global",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["⌘", "N"], description: "New task" },
      { keys: ["⌘", "⇧", "N"], description: "New project" },
      { keys: ["Esc"], description: "Close modal / deselect" },
    ],
  },
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate task list" },
      { keys: ["Enter"], description: "Open selected task" },
    ],
  },
  {
    name: "Task Actions",
    shortcuts: [
      { keys: ["Space"], description: "Toggle task complete" },
      { keys: ["E"], description: "Edit selected task" },
      { keys: ["D"], description: "Set due date" },
      { keys: ["P"], description: "Set priority" },
      { keys: ["T"], description: "Add tags" },
    ],
  },
];

export function ShortcutsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
        <CardDescription>Quick actions for power users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {SHORTCUT_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h3 className="mb-2 font-medium text-secondary text-xs uppercase tracking-wider">
              {category.name}
            </h3>
            <div className="space-y-1">
              {category.shortcuts.map((shortcut) => (
                <KeyboardShortcut
                  key={shortcut.description}
                  keys={shortcut.keys}
                  description={shortcut.description}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
