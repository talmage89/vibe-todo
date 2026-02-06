import type { Prisma } from "~/platform/db/generated";

export { TaskPriority, TaskStatus } from "~/platform/db/generated";

type SerializedDate<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K] extends Array<infer U>
        ? Array<SerializedDate<U>>
        : T[K];
};

const projectSelect = {
  id: true,
  name: true,
  color: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

type PrismaProject = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

export type Project = SerializedDate<PrismaProject>;

const sectionSelect = {
  id: true,
  name: true,
  position: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SectionSelect;

type PrismaSection = Prisma.SectionGetPayload<{ select: typeof sectionSelect }>;

export type Section = SerializedDate<PrismaSection>;

const taskSelect = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  priority: true,
  status: true,
  position: true,
  projectId: true,
  sectionId: true,
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
  Pick<Task, "title" | "description" | "dueDate" | "priority" | "status" | "sectionId">
> & {
  tagIds?: string[];
};

export type CreateTaskData = {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: Task["priority"];
  status?: Task["status"];
  sectionId?: string | null;
  tagIds?: string[];
};
