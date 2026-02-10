import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { EmptyState } from "~/components/ui/empty-state";

export const UpcomingView = () => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 items-center border-border border-b px-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-secondary" />
          <h1 className="font-semibold text-sm">Upcoming</h1>
        </div>
      </div>
      <EmptyState
        icon={CalendarDaysIcon}
        title="No upcoming tasks"
        description="Tasks due within the next 7 days across all projects will appear here"
        className="flex-1"
      />
    </div>
  );
};
