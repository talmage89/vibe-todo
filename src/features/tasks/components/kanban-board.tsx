import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "~/components/ui/cn";
import { useKanbanDragDrop } from "../hooks/use-kanban-drag-drop";
import type { Task, TaskStatus } from "../types";
import { TaskStatus as TaskStatusEnum } from "../types";
import { KanbanCard } from "./kanban-card";

interface KanbanBoardProps {
  tasks: Task[];
  onClickTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: TaskStatusEnum.TODO, label: "Todo" },
  { status: TaskStatusEnum.IN_PROGRESS, label: "In Progress" },
  { status: TaskStatusEnum.DONE, label: "Done" },
];

function SortableCard({ task, onClick }: { task: Task; onClick: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(isDragging && "opacity-30")}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <KanbanCard task={task} onClick={onClick} />
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  tasks,
  onClickTask,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onClickTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded transition-colors",
        isOver ? "bg-surface" : "bg-surface/50",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="font-medium text-secondary text-xs uppercase tracking-wide">{label}</h3>
        <span className="font-medium text-secondary text-xs">{tasks.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex flex-1 flex-col gap-1.5 overflow-y-auto rounded px-1.5 pb-1.5 transition-colors",
            isOver && tasks.length === 0 && "bg-surface",
          )}
        >
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} onClick={onClickTask} />
          ))}
          {tasks.length === 0 && (
            <p
              className={cn(
                "px-2 py-4 text-center text-xs transition-colors",
                isOver ? "text-primary" : "text-secondary",
              )}
            >
              {isOver ? "Drop here" : "No tasks"}
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ tasks, onClickTask, onUpdateTaskStatus }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    activeTask,
    columns,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanDragDrop({ tasks, onUpdateTaskStatus });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full gap-3 overflow-x-auto px-4 py-3">
        {COLUMNS.map(({ status, label }) => {
          const columnTasks = columns[status] ?? [];
          return (
            <KanbanColumn
              key={status}
              status={status}
              label={label}
              tasks={columnTasks}
              onClickTask={onClickTask}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-72">
            <KanbanCard task={activeTask} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
