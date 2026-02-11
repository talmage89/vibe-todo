import { describe, expect, mock, test } from "bun:test";

const fn = () =>
  mock() as ReturnType<typeof mock> & { mockResolvedValueOnce: (v: unknown) => void };

const mockTask = { findMany: fn(), count: fn() };

mock.module("~/platform/db", () => ({
  db: { task: mockTask },
}));

const { search } = await import("../service");

function resetMocks() {
  for (const f of Object.values(mockTask)) f.mockClear();
}

const searchResultInclude = {
  project: { select: { id: true, name: true, color: true } },
  subtasks: { orderBy: { position: "asc" } },
  tags: true,
};

function makeFakeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task_1",
    title: "Buy groceries",
    description: "Get milk and eggs from the store",
    status: "TODO",
    priority: "NONE",
    projectId: "proj_1",
    ...overrides,
  };
}

describe("SearchService", () => {
  describe("search", () => {
    test("builds correct where clause for basic query", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      await search("user_1", { q: "groceries" });

      const expectedWhere = {
        userId: "user_1",
        AND: [
          {
            OR: [
              { title: { contains: "groceries", mode: "insensitive" } },
              { description: { contains: "groceries", mode: "insensitive" } },
              { tags: { some: { name: { contains: "groceries", mode: "insensitive" } } } },
              { project: { name: { contains: "groceries", mode: "insensitive" } } },
            ],
          },
        ],
      };

      expect(mockTask.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        include: searchResultInclude,
        orderBy: [{ updatedAt: "desc" }],
        take: 51,
      });
      expect(mockTask.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    test("includes status filter in where clause", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      await search("user_1", { q: "test", status: "TODO" as never });

      const call = mockTask.findMany.mock.calls[0] as unknown as [
        { where: Record<string, unknown> },
      ];
      const andClause = call[0].where.AND as Array<Record<string, unknown>>;
      expect(andClause).toContainEqual({ status: "TODO" });
    });

    test("includes priority filter in where clause", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      await search("user_1", { q: "test", priority: "HIGH" as never });

      const call = mockTask.findMany.mock.calls[0] as unknown as [
        { where: Record<string, unknown> },
      ];
      const andClause = call[0].where.AND as Array<Record<string, unknown>>;
      expect(andClause).toContainEqual({ priority: "HIGH" });
    });

    test("includes projectId filter in where clause", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      await search("user_1", { q: "test", projectId: "proj_1" });

      const call = mockTask.findMany.mock.calls[0] as unknown as [
        { where: Record<string, unknown> },
      ];
      const andClause = call[0].where.AND as Array<Record<string, unknown>>;
      expect(andClause).toContainEqual({ projectId: "proj_1" });
    });

    test("trims query whitespace", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      await search("user_1", { q: "  groceries  " });

      const call = mockTask.findMany.mock.calls[0] as unknown as [
        { where: Record<string, unknown> },
      ];
      const andClause = call[0].where.AND as Array<{
        OR?: Array<{ title?: Record<string, unknown> }>;
      }>;
      expect(andClause[0]?.OR?.[0]?.title).toEqual({
        contains: "groceries",
        mode: "insensitive",
      });
    });

    test("returns empty results when no matches", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      const result = await search("user_1", { q: "nothing" });

      expect(result).toEqual({
        results: [],
        nextCursor: undefined,
        hasMore: false,
        total: 0,
      });
    });

    test("returns results with title highlights", async () => {
      resetMocks();
      const task = makeFakeTask();
      mockTask.findMany.mockResolvedValueOnce([task]);
      mockTask.count.mockResolvedValueOnce(1);

      const result = await search("user_1", { q: "groceries" });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.highlights).toEqual([{ field: "title", snippet: "Buy groceries" }]);
      expect(result.total).toBe(1);
    });

    test("returns results with description highlights", async () => {
      resetMocks();
      const task = makeFakeTask();
      mockTask.findMany.mockResolvedValueOnce([task]);
      mockTask.count.mockResolvedValueOnce(1);

      const result = await search("user_1", { q: "milk" });

      expect(result.results[0]?.highlights).toEqual([
        { field: "description", snippet: "Get milk and eggs from the store" },
      ]);
    });

    test("returns highlights for both title and description when both match", async () => {
      resetMocks();
      const task = makeFakeTask({
        title: "Buy eggs",
        description: "Get eggs from the store",
      });
      mockTask.findMany.mockResolvedValueOnce([task]);
      mockTask.count.mockResolvedValueOnce(1);

      const result = await search("user_1", { q: "eggs" });

      expect(result.results[0]?.highlights).toHaveLength(2);
      expect(result.results[0]?.highlights[0]?.field).toBe("title");
      expect(result.results[0]?.highlights[1]?.field).toBe("description");
    });

    test("handles null description gracefully", async () => {
      resetMocks();
      const task = makeFakeTask({ description: null });
      mockTask.findMany.mockResolvedValueOnce([task]);
      mockTask.count.mockResolvedValueOnce(1);

      const result = await search("user_1", { q: "groceries" });

      expect(result.results[0]?.highlights).toEqual([{ field: "title", snippet: "Buy groceries" }]);
    });

    test("paginates with cursor", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      await search("user_1", { q: "test", cursor: "cursor_123" });

      expect(mockTask.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: searchResultInclude,
        orderBy: [{ updatedAt: "desc" }],
        take: 51,
        cursor: { id: "cursor_123" },
        skip: 1,
      });
    });

    test("detects hasMore and returns nextCursor", async () => {
      resetMocks();
      const tasks = Array.from({ length: 4 }, (_, i) =>
        makeFakeTask({ id: `task_${i}`, title: "Match query" }),
      );
      mockTask.findMany.mockResolvedValueOnce(tasks);
      mockTask.count.mockResolvedValueOnce(10);

      const result = await search("user_1", { q: "Match", limit: 3 });

      expect(result.results).toHaveLength(3);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe("task_2");
      expect(result.total).toBe(10);
    });

    test("respects custom limit", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      await search("user_1", { q: "test", limit: 10 });

      const call = mockTask.findMany.mock.calls[0] as unknown as [{ take: number }];
      expect(call[0].take).toBe(11);
    });

    test("caps limit at 100", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      mockTask.count.mockResolvedValueOnce(0);

      await search("user_1", { q: "test", limit: 999 });

      const call = mockTask.findMany.mock.calls[0] as unknown as [{ take: number }];
      expect(call[0].take).toBe(101);
    });

    test("builds snippet with ellipsis for long descriptions", async () => {
      resetMocks();
      const longDesc = `${"A".repeat(100)}match${"B".repeat(100)}`;
      const task = makeFakeTask({ description: longDesc });
      mockTask.findMany.mockResolvedValueOnce([task]);
      mockTask.count.mockResolvedValueOnce(1);

      const result = await search("user_1", { q: "match" });

      const snippet = result.results[0]?.highlights[0]?.snippet;
      expect(snippet?.startsWith("...")).toBe(true);
      expect(snippet?.endsWith("...")).toBe(true);
      expect(snippet).toContain("match");
    });
  });
});
