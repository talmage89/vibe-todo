import { cn } from "~/components/ui/cn";

const PROJECT_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gray", value: "#6b7280" },
  { name: "Slate", value: "#64748b" },
] as const;

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PROJECT_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={cn(
            "h-7 w-7 rounded transition-all",
            value === color.value && "ring-2 ring-accent ring-offset-2 ring-offset-background",
          )}
          style={{ backgroundColor: color.value }}
          aria-label={color.name}
          aria-pressed={value === color.value}
        />
      ))}
    </div>
  );
};
