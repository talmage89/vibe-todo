import type { Prisma } from "~/platform/db/generated";
import type { SerializedDate } from "~/types/serialization";

const searchResultSelect = {
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
  project: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
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

type PrismaSearchResult = Prisma.TaskGetPayload<{
  select: typeof searchResultSelect;
}>;

export type SearchResultTask = SerializedDate<PrismaSearchResult>;

export type Highlight = {
  field: "title" | "description";
  snippet: string;
};

export type SearchResult = SearchResultTask & {
  highlights: Highlight[];
};
