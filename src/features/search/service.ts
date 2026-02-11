import { db } from "~/platform/db";

const searchTaskInclude = {
  project: { select: { id: true, name: true, color: true } },
  subtasks: { orderBy: { position: "asc" as const } },
  tags: true,
} as const;

export async function searchTasks(userId: string, query: string) {
  const tasks = await db.task.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { some: { name: { contains: query, mode: "insensitive" } } } },
        { project: { name: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: searchTaskInclude,
    orderBy: [{ project: { name: "asc" } }, { position: "asc" }],
  });

  return { tasks };
}
