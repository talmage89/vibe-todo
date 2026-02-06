import { getNextSubtaskPosition, reorderSubtasks } from "~/platform/api/position";
import { db } from "~/platform/db";

export async function listSubtasks(taskId: string) {
  return db.subtask.findMany({
    where: { taskId },
    orderBy: { position: "asc" },
  });
}

export async function createSubtask(taskId: string, title: string) {
  const position = await getNextSubtaskPosition(taskId);

  return db.subtask.create({
    data: { title, position, taskId },
  });
}

type UpdateSubtaskData = {
  title?: string;
  completed?: boolean;
};

export async function updateSubtask(subtaskId: string, data: UpdateSubtaskData) {
  return db.subtask.update({
    where: { id: subtaskId },
    data: {
      title: data.title,
      completed: data.completed,
    },
  });
}

export async function deleteSubtask(subtaskId: string) {
  await db.subtask.delete({ where: { id: subtaskId } });
}

export async function reorderTaskSubtasks(taskId: string, subtaskIds: string[]) {
  await reorderSubtasks(taskId, subtaskIds);

  return db.subtask.findMany({
    where: { taskId },
    orderBy: { position: "asc" },
  });
}
