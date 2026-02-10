import { db } from "~/platform/db";
import { TaskStatus } from "~/platform/db/generated";

const crossProjectTaskInclude = {
  project: { select: { id: true, name: true, color: true } },
  subtasks: { orderBy: { position: "asc" as const } },
  tags: true,
} as const;

export async function getInboxTasks(userId: string) {
  const tasks = await db.task.findMany({
    where: {
      userId,
      status: TaskStatus.TODO,
    },
    include: crossProjectTaskInclude,
    orderBy: [{ project: { name: "asc" } }, { position: "asc" }],
  });

  return { tasks };
}

export async function getTodayTasks(userId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await db.task.findMany({
    where: {
      userId,
      dueDate: { gte: startOfDay, lt: endOfDay },
    },
    include: crossProjectTaskInclude,
    orderBy: [{ project: { name: "asc" } }, { position: "asc" }],
  });

  return { tasks };
}

export async function getUpcomingTasks(userId: string) {
  const now = new Date();
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const endOfRange = new Date(startOfTomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);

  const tasks = await db.task.findMany({
    where: {
      userId,
      dueDate: { gte: startOfTomorrow, lt: endOfRange },
    },
    include: crossProjectTaskInclude,
    orderBy: [{ dueDate: "asc" }, { project: { name: "asc" } }, { position: "asc" }],
  });

  return { tasks };
}
