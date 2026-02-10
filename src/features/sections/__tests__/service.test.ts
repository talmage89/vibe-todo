import { describe, expect, mock, test } from "bun:test";

const fn = () =>
  mock() as ReturnType<typeof mock> & { mockResolvedValueOnce: (v: unknown) => void };

const mockSection = {
  findMany: fn(),
  create: fn(),
  update: fn(),
  delete: fn(),
};

mock.module("~/platform/db", () => ({ db: { section: mockSection } }));

const mockGetNextSectionPosition = fn();
const mockReorderSections = fn();

mock.module("~/platform/api/position", () => ({
  getNextSectionPosition: mockGetNextSectionPosition,
  reorderSections: mockReorderSections,
  getNextTaskPosition: mock(),
  reorderTasks: mock(),
  getNextSubtaskPosition: mock(),
  reorderSubtasks: mock(),
}));

const { listSections, createSection, updateSection, deleteSection, reorderProjectSections } =
  await import("../service");

function resetMocks() {
  for (const f of Object.values(mockSection)) f.mockClear();
  mockGetNextSectionPosition.mockClear();
  mockReorderSections.mockClear();
}

describe("SectionService", () => {
  describe("listSections", () => {
    test("queries with correct params", async () => {
      resetMocks();
      mockSection.findMany.mockResolvedValueOnce([]);
      await listSections("proj_1");
      expect(mockSection.findMany).toHaveBeenCalledWith({
        where: { projectId: "proj_1" },
        orderBy: { position: "asc" },
      });
    });
  });

  describe("createSection", () => {
    test("creates section with next position", async () => {
      resetMocks();
      mockGetNextSectionPosition.mockResolvedValueOnce(3);
      mockSection.create.mockResolvedValueOnce({ id: "sec_new" });

      await createSection("proj_1", "New Section");
      expect(mockGetNextSectionPosition).toHaveBeenCalledWith("proj_1");
      expect(mockSection.create).toHaveBeenCalledWith({
        data: { name: "New Section", position: 3, projectId: "proj_1" },
      });
    });
  });

  describe("updateSection", () => {
    test("updates section name", async () => {
      resetMocks();
      mockSection.update.mockResolvedValueOnce({ id: "sec_1" });

      await updateSection("sec_1", { name: "Renamed" });
      expect(mockSection.update).toHaveBeenCalledWith({
        where: { id: "sec_1" },
        data: { name: "Renamed" },
      });
    });
  });

  describe("deleteSection", () => {
    test("deletes section by id", async () => {
      resetMocks();
      await deleteSection("sec_1");
      expect(mockSection.delete).toHaveBeenCalledWith({ where: { id: "sec_1" } });
    });
  });

  describe("reorderProjectSections", () => {
    test("reorders and returns updated sections", async () => {
      resetMocks();
      mockSection.findMany.mockResolvedValueOnce([{ id: "sec_2" }, { id: "sec_1" }]);

      await reorderProjectSections("proj_1", ["sec_2", "sec_1"]);
      expect(mockReorderSections).toHaveBeenCalledWith("proj_1", ["sec_2", "sec_1"]);
      expect(mockSection.findMany).toHaveBeenCalledWith({
        where: { projectId: "proj_1" },
        orderBy: { position: "asc" },
      });
    });
  });
});
