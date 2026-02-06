import { TrashIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Section } from "~/features/sections/hooks/use-sections";
import { TaskPriority, TaskStatus } from "~/platform/db/generated";
import type { Subtask, Task } from "../hooks/use-task";
import { ActivityLog } from "./activity-log";
import { DescriptionField } from "./description-field";
import { DueDateField } from "./due-date-field";
import { SubtaskList } from "./subtask-list";
import { TitleField } from "./title-field";

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  loading: boolean;
  sections: Section[];
  onUpdateTask: (
    updates: Partial<
      Pick<Task, "title" | "description" | "dueDate" | "priority" | "status" | "sectionId">
    >,
  ) => Promise<Task>;
  onDeleteTask: () => Promise<void>;
  onCreateSubtask: (title: string) => Promise<Subtask>;
  onUpdateSubtask: (
    subtaskId: string,
    updates: Partial<Pick<Subtask, "title" | "completed">>,
  ) => Promise<Subtask>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
  onReorderSubtasks: (subtaskIds: string[]) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: TaskPriority.NONE, label: "No priority" },
  { value: TaskPriority.LOW, label: "Low" },
  { value: TaskPriority.MEDIUM, label: "Medium" },
  { value: TaskPriority.HIGH, label: "High" },
  { value: TaskPriority.URGENT, label: "Urgent" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: TaskStatus.TODO, label: "To do" },
  { value: TaskStatus.IN_PROGRESS, label: "In progress" },
  { value: TaskStatus.DONE, label: "Done" },
];

const NO_SECTION_VALUE = "__none__";

export function TaskDetailModal({
  open,
  onOpenChange,
  task,
  loading,
  sections,
  onUpdateTask,
  onDeleteTask,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
}: TaskDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = useCallback(async () => {
    try {
      setDeleteLoading(true);
      await onDeleteTask();
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch {
      setDeleteLoading(false);
    }
  }, [onDeleteTask, onOpenChange]);

  if (!task && !loading) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="max-h-[70vh] space-y-6 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-secondary text-sm">Loading...</div>
            ) : task ? (
              <>
                <TitleField value={task.title} onSave={(title) => onUpdateTask({ title })} />

                <DescriptionField
                  value={task.description}
                  onSave={(description) => onUpdateTask({ description })}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-medium text-secondary text-xs">Status</label>
                    <Select
                      value={task.status}
                      onValueChange={(value) => onUpdateTask({ status: value as TaskStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-secondary text-xs">Priority</label>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => onUpdateTask({ priority: value as TaskPriority })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-secondary text-xs">Section</label>
                    <Select
                      value={task.sectionId ?? NO_SECTION_VALUE}
                      onValueChange={(value) =>
                        onUpdateTask({ sectionId: value === NO_SECTION_VALUE ? null : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_SECTION_VALUE}>No section</SelectItem>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DueDateField
                  value={task.dueDate}
                  onSave={(dueDate) => onUpdateTask({ dueDate })}
                />

                <SubtaskList
                  subtasks={task.subtasks}
                  onCreateSubtask={onCreateSubtask}
                  onUpdateSubtask={onUpdateSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onReorderSubtasks={onReorderSubtasks}
                />

                <ActivityLog />

                <div className="border-border border-t pt-4">
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <TrashIcon className="h-4 w-4" />
                    Delete task
                  </Button>
                </div>
              </>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </>
  );
}
