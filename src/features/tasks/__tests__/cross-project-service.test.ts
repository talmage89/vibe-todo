import { describe, expect, mock, test } from "bun:test";

const fn = () =>
  mock() as ReturnType<typeof mock> & { mockResolvedValueOnce: (v: unknown) => void };

const mockTask = { findMany: fn() };

mock.module("~/platform/db", () => ({
  db: { task: mockTask },
}));

const { getInboxTasks, getTodayTasks, getUpcomingTasks } = await import("../cross-project-service");

function resetMocks() {
  for (const f of Object.values(mockTask)) f.mockClear();
}

const crossProjectTaskInclude = {
  project: { select: { id: true, name: true, color: true } },
  subtasks: { orderBy: { position: "asc" } },
  tags: true,
};

describe("CrossProjectService", () => {
  describe("getInboxTasks", () => {
    test("queries TODO tasks for user across all projects", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);

      const result = await getInboxTasks("user_1");

      expect(mockTask.findMany).toHaveBeenCalledWith({
        where: { userId: "user_1", status: "TODO" },
        include: crossProjectTaskInclude,
        orderBy: [{ project: { name: "asc" } }, { position: "asc" }],
      });
      expect(result).toEqual({ tasks: [] });
    });

    test("returns tasks with project and tag relations", async () => {
      resetMocks();
      const tasks = [
        { id: "t1", projectId: "p1", status: "TODO", project: { id: "p1", name: "A" } },
        { id: "t2", projectId: "p2", status: "TODO", project: { id: "p2", name: "B" } },
      ];
      mockTask.findMany.mockResolvedValueOnce(tasks);

      const result = await getInboxTasks("user_1");

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0]?.id).toBe("t1");
      expect(result.tasks[1]?.id).toBe("t2");
    });
  });

  describe("getTodayTasks", () => {
    test("queries tasks with dueDate matching today", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);

      await getTodayTasks("user_1");

      const call = mockTask.findMany.mock.calls[0] as unknown as [Record<string, unknown>];
      const where = call[0].where as { userId: string; dueDate: { gte: Date; lt: Date } };
      expect(where.userId).toBe("user_1");

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      expect(where.dueDate.gte.getTime()).toBe(startOfDay.getTime());
      expect(where.dueDate.lt.getTime()).toBe(endOfDay.getTime());
      expect(call[0].include).toEqual(crossProjectTaskInclude);
    });
  });

  describe("getUpcomingTasks", () => {
    test("queries tasks due within next 7 days starting tomorrow", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);

      await getUpcomingTasks("user_1");

      const call = mockTask.findMany.mock.calls[0] as unknown as [Record<string, unknown>];
      const where = call[0].where as { userId: string; dueDate: { gte: Date; lt: Date } };
      expect(where.userId).toBe("user_1");

      const now = new Date();
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const endOfRange = new Date(startOfTomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);

      expect(where.dueDate.gte.getTime()).toBe(startOfTomorrow.getTime());
      expect(where.dueDate.lt.getTime()).toBe(endOfRange.getTime());
    });

    test("orders by dueDate then project name then position", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);

      await getUpcomingTasks("user_1");

      const call = mockTask.findMany.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(call[0].orderBy).toEqual([
        { dueDate: "asc" },
        { project: { name: "asc" } },
        { position: "asc" },
      ]);
    });
  });
});
