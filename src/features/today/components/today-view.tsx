import { CalendarIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "~/components/ui/empty-state";

export const TodayView = () => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 items-center border-border border-b px-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-secondary" />
          <h1 className="font-semibold text-sm">Today</h1>
        </div>
      </div>
      <EmptyState
        icon={CalendarIcon}
        title="No tasks due today"
        description="Tasks due today across all projects will appear here"
        className="flex-1"
      />
    </div>
  );
};
