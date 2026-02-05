import { cn } from "~/components/ui/cn";
import { PROJECT_COLORS } from "../constants";

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
            "aspect-square w-full cursor-pointer rounded transition-all",
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
