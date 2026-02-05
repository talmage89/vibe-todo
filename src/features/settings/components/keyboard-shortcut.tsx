interface KeyboardShortcutProps {
  keys: string[];
  description: string;
}

export function KeyboardShortcut({ keys, description }: KeyboardShortcutProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-primary text-sm">{description}</span>
      <kbd className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span
            key={index}
            className="min-w-[24px] rounded border border-border bg-surface px-1.5 py-0.5 text-center font-mono text-secondary text-xs"
          >
            {key}
          </span>
        ))}
      </kbd>
    </div>
  );
}
