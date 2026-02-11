import { db } from "~/platform/db";
import type { Prisma, TaskPriority, TaskStatus } from "~/platform/db/generated";
import type { Highlight } from "./types";

const DEFAULT_PAGE_SIZE = 50;

const searchResultInclude = {
  project: { select: { id: true, name: true, color: true } },
  subtasks: { orderBy: { position: "asc" as const } },
  tags: true,
} as const;

type SearchOptions = {
  q: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  cursor?: string;
  limit?: number;
};

function buildHighlights(
  task: { title: string; description: string | null },
  query: string,
): Highlight[] {
  const highlights: Highlight[] = [];
  const lowerQuery = query.toLowerCase();

  if (task.title.toLowerCase().includes(lowerQuery)) {
    highlights.push({ field: "title", snippet: buildSnippet(task.title, query) });
  }

  if (task.description?.toLowerCase().includes(lowerQuery)) {
    highlights.push({
      field: "description",
      snippet: buildSnippet(task.description, query),
    });
  }

  return highlights;
}

function buildSnippet(text: string, query: string, contextChars = 80): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) return text.slice(0, contextChars * 2);

  const start = Math.max(0, matchIndex - contextChars);
  const end = Math.min(text.length, matchIndex + query.length + contextChars);

  let snippet = text.slice(start, end);
  if (start > 0) snippet = `...${snippet}`;
  if (end < text.length) snippet = `${snippet}...`;

  return snippet;
}

export async function search(userId: string, options: SearchOptions) {
  const limit = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, 100);
  const query = options.q.trim();

  const where: Prisma.TaskWhereInput = {
    userId,
    AND: [
      {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { some: { name: { contains: query, mode: "insensitive" } } } },
          { project: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      ...(options.status ? [{ status: options.status }] : []),
      ...(options.priority ? [{ priority: options.priority }] : []),
      ...(options.projectId ? [{ projectId: options.projectId }] : []),
    ],
  };

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      include: searchResultInclude,
      orderBy: [{ updatedAt: "desc" }],
      take: limit + 1,
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1,
      }),
    }),
    db.task.count({ where }),
  ]);

  const hasMore = tasks.length > limit;
  const items = hasMore ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  const results = items.map((task) => ({
    ...task,
    highlights: buildHighlights(task, query),
  }));

  return { results, nextCursor, hasMore, total };
}
