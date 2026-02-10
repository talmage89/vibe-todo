import { useMemo } from "react";
import type { Task } from "../types";
import { TaskStatus } from "../types";
import { KanbanCard } from "./kanban-card";

interface KanbanBoardProps {
  tasks: Task[];
  onClickTask: (taskId: string) => void;
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: TaskStatus.TODO, label: "Todo" },
  { status: TaskStatus.IN_PROGRESS, label: "In Progress" },
  { status: TaskStatus.DONE, label: "Done" },
];

export function KanbanBoard({ tasks, onClickTask }: KanbanBoardProps) {
  const tasksByStatus = useMemo(() => {
    const map: Map<TaskStatus, Task[]> = new Map([
      [TaskStatus.TODO, []],
      [TaskStatus.IN_PROGRESS, []],
      [TaskStatus.DONE, []],
    ]);
    for (const task of tasks) {
      map.get(task.status)?.push(task);
    }
    return map;
  }, [tasks]);

  return (
    <div className="flex h-full gap-3 overflow-x-auto px-4 py-3">
      {COLUMNS.map(({ status, label }) => {
        const columnTasks = tasksByStatus.get(status) ?? [];
        return (
          <div key={status} className="flex w-72 shrink-0 flex-col rounded bg-surface/50">
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="font-medium text-secondary text-xs uppercase tracking-wide">
                {label}
              </h3>
              <span className="font-medium text-secondary text-xs">{columnTasks.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-1.5">
              {columnTasks.map((task) => (
                <KanbanCard key={task.id} task={task} onClick={onClickTask} />
              ))}
              {columnTasks.length === 0 && (
                <p className="px-2 py-4 text-center text-secondary text-xs">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
