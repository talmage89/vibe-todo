import type { Prisma } from "~/platform/db/generated";
import type { SerializedDate } from "~/types/serialization";

export { TaskPriority, TaskStatus } from "~/platform/db/generated";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  priority: true,
  status: true,
  position: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  subtasks: {
    select: {
      id: true,
      title: true,
      completed: true,
      position: true,
      taskId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  tags: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
} satisfies Prisma.TaskSelect;

type PrismaTask = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

export type Task = SerializedDate<PrismaTask>;
export type Subtask = Task["subtasks"][number];
export type Tag = Task["tags"][number];

export type TaskUpdates = Partial<
  Pick<Task, "title" | "description" | "dueDate" | "priority" | "status">
> & {
  tagIds?: string[];
};

export type CreateTaskData = {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: Task["priority"];
  status?: Task["status"];
  tagIds?: string[];
};
