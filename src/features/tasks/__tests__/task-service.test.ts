import { describe, expect, mock, test } from "bun:test";

const fn = () =>
  mock() as ReturnType<typeof mock> & { mockResolvedValueOnce: (v: unknown) => void };

const mockTask = {
  findMany: fn(),
  findUnique: fn(),
  create: fn(),
  update: fn(),
  delete: fn(),
};
const mockSection = { findUnique: fn() };
const mockTagDb = { findMany: fn() };

mock.module("~/platform/db", () => ({
  db: { task: mockTask, section: mockSection, tag: mockTagDb },
}));

const mockGetNextTaskPosition = fn();
const mockReorderTasks = fn();

mock.module("~/platform/api/position", () => ({
  getNextTaskPosition: mockGetNextTaskPosition,
  reorderTasks: mockReorderTasks,
  getNextSectionPosition: mock(),
  reorderSections: mock(),
  getNextSubtaskPosition: mock(),
  reorderSubtasks: mock(),
}));

const { listTasks, createTask, getTask, updateTask, deleteTask, reorderProjectTasks } =
  await import("../task-service");
const { ValidationError } = await import("~/platform/auth/errors");

function resetMocks() {
  for (const f of Object.values(mockTask)) f.mockClear();
  for (const f of Object.values(mockSection)) f.mockClear();
  for (const f of Object.values(mockTagDb)) f.mockClear();
  mockGetNextTaskPosition.mockClear();
  mockReorderTasks.mockClear();
}

const taskInclude = { subtasks: { orderBy: { position: "asc" } }, tags: true };

describe("TaskService", () => {
  describe("listTasks", () => {
    test("queries with correct params", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      const result = await listTasks("proj_1");
      expect(mockTask.findMany).toHaveBeenCalledWith({
        where: {
          projectId: "proj_1",
          sectionId: undefined,
          status: undefined,
          priority: undefined,
        },
        include: taskInclude,
        orderBy: { position: "asc" },
        take: 51,
      });
      expect(result).toEqual({ tasks: [], nextCursor: undefined, hasMore: false });
    });

    test("passes filters through", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);
      await listTasks("proj_1", { sectionId: "sec_1", status: "TODO", priority: "HIGH" });
      expect(mockTask.findMany).toHaveBeenCalledWith({
        where: { projectId: "proj_1", sectionId: "sec_1", status: "TODO", priority: "HIGH" },
        include: taskInclude,
        orderBy: { position: "asc" },
        take: 51,
      });
    });
  });

  describe("createTask", () => {
    test("creates task with defaults", async () => {
      resetMocks();
      mockGetNextTaskPosition.mockResolvedValueOnce(5);
      mockTask.create.mockResolvedValueOnce({ id: "task_new" });

      await createTask("user_1", "proj_1", { title: "New" });
      expect(mockGetNextTaskPosition).toHaveBeenCalledWith("proj_1", null);
      expect(mockTask.create).toHaveBeenCalledWith({
        data: {
          title: "New",
          description: undefined,
          dueDate: undefined,
          priority: "NONE",
          status: "TODO",
          position: 5,
          userId: "user_1",
          projectId: "proj_1",
          sectionId: null,
        },
        include: taskInclude,
      });
    });

    test("validates section belongs to project", async () => {
      resetMocks();
      mockSection.findUnique.mockResolvedValueOnce({ id: "sec_1", projectId: "proj_other" });

      await expect(
        createTask("user_1", "proj_1", { title: "Task", sectionId: "sec_1" }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(mockTask.create).not.toHaveBeenCalled();
    });

    test("throws when section not found", async () => {
      resetMocks();
      mockSection.findUnique.mockResolvedValueOnce(null);

      await expect(
        createTask("user_1", "proj_1", { title: "Task", sectionId: "sec_missing" }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    test("validates tags belong to project", async () => {
      resetMocks();
      mockTagDb.findMany.mockResolvedValueOnce([{ id: "tag_1", projectId: "proj_1" }]);

      await expect(
        createTask("user_1", "proj_1", { title: "Task", tagIds: ["tag_1", "tag_missing"] }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(mockTask.create).not.toHaveBeenCalled();
    });

    test("creates task with tags connected", async () => {
      resetMocks();
      mockGetNextTaskPosition.mockResolvedValueOnce(0);
      mockTagDb.findMany.mockResolvedValueOnce([
        { id: "tag_1", projectId: "proj_1" },
        { id: "tag_2", projectId: "proj_1" },
      ]);
      mockTask.create.mockResolvedValueOnce({ id: "task_new" });

      await createTask("user_1", "proj_1", { title: "Tagged", tagIds: ["tag_1", "tag_2"] });
      const args = mockTask.create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
      expect(args[0].data.tags).toEqual({ connect: [{ id: "tag_1" }, { id: "tag_2" }] });
    });

    test("creates task with valid section", async () => {
      resetMocks();
      mockSection.findUnique.mockResolvedValueOnce({ id: "sec_1", projectId: "proj_1" });
      mockGetNextTaskPosition.mockResolvedValueOnce(2);
      mockTask.create.mockResolvedValueOnce({ id: "task_new" });

      await createTask("user_1", "proj_1", { title: "Sectioned", sectionId: "sec_1" });
      expect(mockGetNextTaskPosition).toHaveBeenCalledWith("proj_1", "sec_1");
      const args = mockTask.create.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
      expect(args[0].data.sectionId).toBe("sec_1");
    });
  });

  describe("getTask", () => {
    test("returns task in project", async () => {
      resetMocks();
      mockTask.findUnique.mockResolvedValueOnce({
        id: "task_1",
        projectId: "proj_1",
        subtasks: [],
        tags: [],
      });

      const result = await getTask("proj_1", "task_1");
      expect(result.id).toBe("task_1");
    });

    test("throws when task not found", async () => {
      resetMocks();
      mockTask.findUnique.mockResolvedValueOnce(null);
      await expect(getTask("proj_1", "task_missing")).rejects.toBeInstanceOf(ValidationError);
    });

    test("throws when task belongs to different project", async () => {
      resetMocks();
      mockTask.findUnique.mockResolvedValueOnce({ id: "task_1", projectId: "proj_other" });
      await expect(getTask("proj_1", "task_1")).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("updateTask", () => {
    test("updates basic fields", async () => {
      resetMocks();
      mockTask.update.mockResolvedValueOnce({ id: "task_1", title: "Updated" });

      const result = await updateTask(
        "proj_1",
        "task_1",
        { position: 0, sectionId: null },
        { title: "Updated" },
      );
      expect(result.id).toBe("task_1");
    });

    test("validates section on update", async () => {
      resetMocks();
      mockSection.findUnique.mockResolvedValueOnce(null);

      await expect(
        updateTask(
          "proj_1",
          "task_1",
          { position: 0, sectionId: null },
          { sectionId: "sec_missing" },
        ),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    test("validates section belongs to correct project", async () => {
      resetMocks();
      mockSection.findUnique.mockResolvedValueOnce({ id: "sec_1", projectId: "proj_other" });

      await expect(
        updateTask("proj_1", "task_1", { position: 0, sectionId: null }, { sectionId: "sec_1" }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    test("validates tags on update", async () => {
      resetMocks();
      mockTagDb.findMany.mockResolvedValueOnce([{ id: "tag_1" }]);

      await expect(
        updateTask(
          "proj_1",
          "task_1",
          { position: 0, sectionId: null },
          { tagIds: ["tag_1", "tag_missing"] },
        ),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    test("recalculates position when section changes", async () => {
      resetMocks();
      mockSection.findUnique.mockResolvedValueOnce({ id: "sec_2", projectId: "proj_1" });
      mockGetNextTaskPosition.mockResolvedValueOnce(7);
      mockTask.update.mockResolvedValueOnce({ id: "task_1" });

      await updateTask(
        "proj_1",
        "task_1",
        { position: 0, sectionId: "sec_1" },
        { sectionId: "sec_2" },
      );
      expect(mockGetNextTaskPosition).toHaveBeenCalledWith("proj_1", "sec_2");
      const args = mockTask.update.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
      expect(args[0].data.position).toBe(7);
    });

    test("does not recalculate position when section unchanged", async () => {
      resetMocks();
      mockTask.update.mockResolvedValueOnce({ id: "task_1" });

      await updateTask(
        "proj_1",
        "task_1",
        { position: 3, sectionId: "sec_1" },
        { title: "Same section" },
      );
      expect(mockGetNextTaskPosition).not.toHaveBeenCalled();
    });

    test("sets tags with set operation", async () => {
      resetMocks();
      mockTagDb.findMany.mockResolvedValueOnce([
        { id: "tag_1", projectId: "proj_1" },
        { id: "tag_2", projectId: "proj_1" },
      ]);
      mockTask.update.mockResolvedValueOnce({ id: "task_1" });

      await updateTask(
        "proj_1",
        "task_1",
        { position: 0, sectionId: null },
        { tagIds: ["tag_1", "tag_2"] },
      );
      const args = mockTask.update.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
      expect(args[0].data.tags).toEqual({ set: [{ id: "tag_1" }, { id: "tag_2" }] });
    });

    test("allows clearing tags with empty array", async () => {
      resetMocks();
      mockTask.update.mockResolvedValueOnce({ id: "task_1" });

      await updateTask("proj_1", "task_1", { position: 0, sectionId: null }, { tagIds: [] });
      const args = mockTask.update.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
      expect(args[0].data.tags).toEqual({ set: [] });
    });

    test("allows moving to null section", async () => {
      resetMocks();
      mockGetNextTaskPosition.mockResolvedValueOnce(0);
      mockTask.update.mockResolvedValueOnce({ id: "task_1" });

      await updateTask(
        "proj_1",
        "task_1",
        { position: 2, sectionId: "sec_1" },
        { sectionId: null },
      );
      expect(mockGetNextTaskPosition).toHaveBeenCalledWith("proj_1", null);
    });
  });

  describe("deleteTask", () => {
    test("deletes task by id", async () => {
      resetMocks();
      await deleteTask("task_1");
      expect(mockTask.delete).toHaveBeenCalledWith({ where: { id: "task_1" } });
    });
  });

  describe("reorderProjectTasks", () => {
    test("reorders and returns updated tasks", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([{ id: "task_2" }, { id: "task_1" }]);

      await reorderProjectTasks("proj_1", "sec_1", ["task_2", "task_1"]);
      expect(mockReorderTasks).toHaveBeenCalledWith("proj_1", "sec_1", ["task_2", "task_1"]);
    });

    test("handles null section", async () => {
      resetMocks();
      mockTask.findMany.mockResolvedValueOnce([]);

      await reorderProjectTasks("proj_1", null, ["task_1"]);
      expect(mockReorderTasks).toHaveBeenCalledWith("proj_1", null, ["task_1"]);
    });
  });
});
