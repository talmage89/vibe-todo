import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback } from "react";
import { Button } from "~/components/ui/button";

interface DueDateFieldProps {
  value: string | null;
  onSave: (value: string | null) => Promise<unknown>;
}

export function DueDateField({ value, onSave }: DueDateFieldProps) {
  const formattedValue = value ? new Date(value).toISOString().split("T")[0] : "";

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value || null;
      await onSave(newValue);
    },
    [onSave],
  );

  const handleClear = useCallback(async () => {
    await onSave(null);
  }, [onSave]);

  return (
    <div className="space-y-1.5">
      <label className="font-medium text-secondary text-xs">Due date</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <CalendarIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            type="date"
            value={formattedValue}
            onChange={handleChange}
            className="h-9 w-full rounded border border-border bg-background py-1.5 pr-3 pl-9 text-primary text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border"
          />
        </div>
        {value && (
          <Button variant="secondary" size="icon" onClick={handleClear}>
            <XMarkIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
