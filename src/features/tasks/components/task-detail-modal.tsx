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
import type { Section } from "~/features/sections/types";
import { useSubtasks } from "../hooks/use-subtasks";
import { useTask } from "../hooks/use-task";
import type { Tag } from "../types";
import { TaskPriority, TaskStatus } from "../types";
import { ActivityLog } from "./activity-log";
import { DescriptionField } from "./description-field";
import { DueDateField } from "./due-date-field";
import { SubtaskList } from "./subtask-list";
import { TagSelect } from "./tag-select";
import { TitleField } from "./title-field";

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId: string | null;
  sections: Section[];
  availableTags?: Tag[];
  onDeleted?: () => void;
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
  projectId,
  taskId,
  sections,
  availableTags = [],
  onDeleted,
}: TaskDetailModalProps) {
  const { task, loading, updateTask, deleteTask } = useTask(projectId, taskId);
  const { createSubtask, updateSubtask, deleteSubtask, reorderSubtasks } = useSubtasks(
    projectId,
    taskId,
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = useCallback(async () => {
    try {
      setDeleteLoading(true);
      await deleteTask();
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onDeleted?.();
    } catch {
      setDeleteLoading(false);
    }
  }, [deleteTask, onOpenChange, onDeleted]);

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
                <TitleField value={task.title} onSave={(title) => updateTask({ title })} />

                <DescriptionField
                  value={task.description}
                  onSave={(description) => updateTask({ description })}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-medium text-secondary text-xs">Status</label>
                    <Select
                      value={task.status}
                      onValueChange={(value) => updateTask({ status: value as TaskStatus })}
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
                      onValueChange={(value) => updateTask({ priority: value as TaskPriority })}
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
                        updateTask({ sectionId: value === NO_SECTION_VALUE ? null : value })
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

                <DueDateField value={task.dueDate} onSave={(dueDate) => updateTask({ dueDate })} />

                {availableTags.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-secondary text-xs">Tags</label>
                    <TagSelect
                      tags={availableTags}
                      selectedIds={task.tags.map((t) => t.id)}
                      onChange={(tagIds) => updateTask({ tagIds })}
                    />
                  </div>
                )}

                <SubtaskList
                  subtasks={task.subtasks}
                  onCreateSubtask={createSubtask}
                  onUpdateSubtask={updateSubtask}
                  onDeleteSubtask={deleteSubtask}
                  onReorderSubtasks={reorderSubtasks}
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
