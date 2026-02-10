import { ListBulletIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
import { cn } from "~/components/ui/cn";
import { DefaultView } from "~/platform/db/generated";

interface ViewToggleProps {
  value: DefaultView;
  onChange: (view: DefaultView) => void;
}

const options = [
  { value: DefaultView.KANBAN, label: "Board", icon: ViewColumnsIcon },
  { value: DefaultView.LIST, label: "List", icon: ListBulletIcon },
] as const;

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded border border-border">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 font-medium text-xs transition-colors duration-100",
            value === option.value
              ? "bg-surface text-primary"
              : "text-secondary hover:bg-surface/50 hover:text-primary",
            option.value === DefaultView.KANBAN && "rounded-l",
            option.value === DefaultView.LIST && "rounded-r",
          )}
          title={`${option.label} view`}
        >
          <option.icon className="h-3.5 w-3.5" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
