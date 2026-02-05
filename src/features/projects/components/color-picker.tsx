import { cn } from "~/components/ui/cn";
import { PROJECT_COLORS } from "../constants";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
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
