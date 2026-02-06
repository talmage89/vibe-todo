import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { TaskPriority } from "~/types/models";

interface PrioritySelectProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  disabled?: boolean;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; className: string }[] = [
  { value: TaskPriority.NONE, label: "No priority", className: "text-secondary" },
  { value: TaskPriority.LOW, label: "Low", className: "text-low" },
  { value: TaskPriority.MEDIUM, label: "Medium", className: "text-medium" },
  { value: TaskPriority.HIGH, label: "High", className: "text-high" },
  { value: TaskPriority.URGENT, label: "Urgent", className: "text-urgent" },
];

export function PrioritySelect({ value, onChange, disabled }: PrioritySelectProps) {
  const selectedOption = PRIORITY_OPTIONS.find((opt) => opt.value === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
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
