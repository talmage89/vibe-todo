import { db } from "~/platform/db";
import { getNextSubtaskPosition, reorderSubtasks } from "./position";

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

export async function updateSubtask(
  subtaskId: string,
  data: { title?: string; completed?: boolean },
) {
  return db.subtask.update({
    where: { id: subtaskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.completed !== undefined && { completed: data.completed }),
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
