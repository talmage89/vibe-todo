import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { TaskPriority } from "../hooks/use-tasks";

interface PrioritySelectProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  disabled?: boolean;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; className: string }[] = [
  { value: "NONE", label: "No priority", className: "text-secondary" },
  { value: "LOW", label: "Low", className: "text-low" },
  { value: "MEDIUM", label: "Medium", className: "text-medium" },
  { value: "HIGH", label: "High", className: "text-high" },
  { value: "URGENT", label: "Urgent", className: "text-urgent" },
];

export function PrioritySelect({ value, onChange, disabled }: PrioritySelectProps) {
  const selectedOption = PRIORITY_OPTIONS.find((opt) => opt.value === value);

  return (
    <Select value={value} onValueChange={onChange as (value: string) => void} disabled={disabled}>
      <SelectTrigger className={selectedOption?.className}>
        <SelectValue placeholder="Select priority" />
      </SelectTrigger>
      <SelectContent>
        {PRIORITY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className={option.className}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
