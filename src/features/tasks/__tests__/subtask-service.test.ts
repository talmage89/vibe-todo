import { describe, expect, mock, test } from "bun:test";

const fn = () =>
  mock() as ReturnType<typeof mock> & { mockResolvedValueOnce: (v: unknown) => void };

const mockSubtask = {
  findMany: fn(),
  create: fn(),
  update: fn(),
  delete: fn(),
};

mock.module("~/platform/db", () => ({ db: { subtask: mockSubtask } }));

const mockGetNextSubtaskPosition = fn();
const mockReorderSubtasks = fn();

mock.module("~/platform/api/position", () => ({
  getNextSubtaskPosition: mockGetNextSubtaskPosition,
  reorderSubtasks: mockReorderSubtasks,
  getNextTaskPosition: mock(),
  reorderTasks: mock(),
  getNextSectionPosition: mock(),
  reorderSections: mock(),
}));

const { listSubtasks, createSubtask, updateSubtask, deleteSubtask, reorderTaskSubtasks } =
  await import("../subtask-service");

function resetMocks() {
  for (const f of Object.values(mockSubtask)) f.mockClear();
  mockGetNextSubtaskPosition.mockClear();
  mockReorderSubtasks.mockClear();
}

describe("SubtaskService", () => {
  describe("listSubtasks", () => {
    test("queries with correct params", async () => {
      resetMocks();
      mockSubtask.findMany.mockResolvedValueOnce([]);
      await listSubtasks("task_1");
      expect(mockSubtask.findMany).toHaveBeenCalledWith({
        where: { taskId: "task_1" },
        orderBy: { position: "asc" },
      });
    });
  });

  describe("createSubtask", () => {
    test("creates subtask with next position", async () => {
      resetMocks();
      mockGetNextSubtaskPosition.mockResolvedValueOnce(4);
      mockSubtask.create.mockResolvedValueOnce({ id: "sub_new" });

      await createSubtask("task_1", "New");
      expect(mockGetNextSubtaskPosition).toHaveBeenCalledWith("task_1");
      expect(mockSubtask.create).toHaveBeenCalledWith({
        data: { title: "New", position: 4, taskId: "task_1" },
      });
    });
  });

  describe("updateSubtask", () => {
    test("updates subtask title", async () => {
      resetMocks();
      mockSubtask.update.mockResolvedValueOnce({ id: "sub_1" });

      await updateSubtask("sub_1", { title: "Renamed" });
      expect(mockSubtask.update).toHaveBeenCalledWith({
        where: { id: "sub_1" },
        data: { title: "Renamed", completed: undefined },
      });
    });

    test("updates completed status", async () => {
      resetMocks();
      mockSubtask.update.mockResolvedValueOnce({ id: "sub_1" });

      await updateSubtask("sub_1", { completed: true });
      expect(mockSubtask.update).toHaveBeenCalledWith({
        where: { id: "sub_1" },
        data: { title: undefined, completed: true },
      });
    });
  });

  describe("deleteSubtask", () => {
    test("deletes subtask by id", async () => {
      resetMocks();
      await deleteSubtask("sub_1");
      expect(mockSubtask.delete).toHaveBeenCalledWith({ where: { id: "sub_1" } });
    });
  });

  describe("reorderTaskSubtasks", () => {
    test("reorders and returns results", async () => {
      resetMocks();
      mockSubtask.findMany.mockResolvedValueOnce([{ id: "sub_2" }, { id: "sub_1" }]);

      await reorderTaskSubtasks("task_1", ["sub_2", "sub_1"]);
      expect(mockReorderSubtasks).toHaveBeenCalledWith("task_1", ["sub_2", "sub_1"]);
      expect(mockSubtask.findMany).toHaveBeenCalledWith({
        where: { taskId: "task_1" },
        orderBy: { position: "asc" },
      });
    });
  });
});
