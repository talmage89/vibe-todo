import { ValidationError } from "~/platform/auth/errors";
import { db } from "~/platform/db";

export async function getNextTaskPosition(
  projectId: string,
  sectionId: string | null,
): Promise<number> {
  const result = await db.task.aggregate({
    where: { projectId, sectionId },
    _max: { position: true },
  });
  return (result._max.position ?? -1) + 1;
}

export async function getNextSubtaskPosition(taskId: string): Promise<number> {
  const result = await db.subtask.aggregate({
    where: { taskId },
    _max: { position: true },
  });
  return (result._max.position ?? -1) + 1;
}

export async function getNextSectionPosition(projectId: string): Promise<number> {
  const result = await db.section.aggregate({
    where: { projectId },
    _max: { position: true },
  });
  return (result._max.position ?? -1) + 1;
}

function validateReorderIds(
  existingIds: Set<string>,
  providedIds: string[],
  entityLabel: string,
  scopeLabel: string,
) {
  const providedSet = new Set(providedIds);

  for (const id of providedIds) {
    if (!existingIds.has(id)) {
      throw new ValidationError(`${entityLabel} ${id} not found in this ${scopeLabel}`);
    }
  }

  for (const id of existingIds) {
    if (!providedSet.has(id)) {
      throw new ValidationError(
        `All ${entityLabel.toLowerCase()}s in the ${scopeLabel} must be included in reorder`,
      );
    }
  }
}

export async function reorderTasks(projectId: string, sectionId: string | null, taskIds: string[]) {
  const existing = await db.task.findMany({
    where: { projectId, sectionId },
    select: { id: true },
  });
  validateReorderIds(new Set(existing.map((e) => e.id)), taskIds, "Task", "section");

  await db.$transaction(
    taskIds.map((id, index) => db.task.update({ where: { id }, data: { position: index } })),
  );
}

export async function reorderSubtasks(taskId: string, subtaskIds: string[]) {
  const existing = await db.subtask.findMany({
    where: { taskId },
    select: { id: true },
  });
  validateReorderIds(new Set(existing.map((e) => e.id)), subtaskIds, "Subtask", "task");

  await db.$transaction(
    subtaskIds.map((id, index) => db.subtask.update({ where: { id }, data: { position: index } })),
  );
}

export async function reorderSections(projectId: string, sectionIds: string[]) {
  const existing = await db.section.findMany({
    where: { projectId },
    select: { id: true },
  });
  validateReorderIds(new Set(existing.map((e) => e.id)), sectionIds, "Section", "project");

  await db.$transaction(
    sectionIds.map((id, index) => db.section.update({ where: { id }, data: { position: index } })),
  );
}
