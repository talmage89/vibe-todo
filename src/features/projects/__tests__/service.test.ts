import { describe, expect, mock, test } from "bun:test";

const fn = () =>
  mock() as ReturnType<typeof mock> & { mockResolvedValueOnce: (v: unknown) => void };

const mockProject = {
  findMany: fn(),
  findFirst: fn(),
  findUnique: fn(),
  create: fn(),
  update: fn(),
  delete: fn(),
};

mock.module("~/platform/db", () => ({ db: { project: mockProject } }));

const mockVerifyProjectAccess = fn();
mock.module("~/platform/api/access", () => ({
  verifyProjectAccess: mockVerifyProjectAccess,
}));

const { listProjects, createProject, getProject, updateProject, deleteProject } = await import(
  "../service"
);
const { ValidationError } = await import("~/platform/auth/errors");

function resetMocks() {
  for (const f of Object.values(mockProject)) f.mockClear();
  mockVerifyProjectAccess.mockClear();
}

describe("ProjectService", () => {
  describe("listProjects", () => {
    test("queries with correct params", async () => {
      resetMocks();
      mockProject.findMany.mockResolvedValueOnce([]);
      await listProjects("user_1");
      expect(mockProject.findMany).toHaveBeenCalledWith({
        where: { userId: "user_1" },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("createProject", () => {
    test("creates project when name is unique", async () => {
      resetMocks();
      mockProject.findFirst.mockResolvedValueOnce(null);
      mockProject.create.mockResolvedValueOnce({ id: "proj_new" });

      const result = await createProject("user_1", "New Project");
      expect(result).toBeTruthy();
      expect(mockProject.create).toHaveBeenCalledWith({
        data: { name: "New Project", color: null, userId: "user_1" },
      });
    });

    test("creates project with color", async () => {
      resetMocks();
      mockProject.findFirst.mockResolvedValueOnce(null);
      mockProject.create.mockResolvedValueOnce({ id: "proj_new" });

      await createProject("user_1", "Colored", "#ff0000");
      expect(mockProject.create).toHaveBeenCalledWith({
        data: { name: "Colored", color: "#ff0000", userId: "user_1" },
      });
    });

    test("throws ValidationError when name already exists", async () => {
      resetMocks();
      mockProject.findFirst.mockResolvedValueOnce({ id: "proj_existing" });

      await expect(createProject("user_1", "Existing")).rejects.toBeInstanceOf(ValidationError);
      expect(mockProject.create).not.toHaveBeenCalled();
    });
  });

  describe("getProject", () => {
    test("delegates to verifyProjectAccess", async () => {
      resetMocks();
      mockVerifyProjectAccess.mockResolvedValueOnce({ id: "proj_1" });

      await getProject("user_1", "proj_1");
      expect(mockVerifyProjectAccess).toHaveBeenCalledWith("user_1", "proj_1");
    });
  });

  describe("updateProject", () => {
    test("updates project fields", async () => {
      resetMocks();
      mockProject.update.mockResolvedValueOnce({ id: "proj_1", name: "Updated" });

      await updateProject("user_1", "proj_1", { name: "Updated", color: "#00ff00" });
      expect(mockVerifyProjectAccess).toHaveBeenCalledWith("user_1", "proj_1");
      expect(mockProject.update).toHaveBeenCalled();
    });

    test("throws ValidationError when name is empty", async () => {
      resetMocks();
      await expect(updateProject("user_1", "proj_1", { name: "   " })).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(mockProject.update).not.toHaveBeenCalled();
    });

    test("allows clearing color to null", async () => {
      resetMocks();
      mockProject.update.mockResolvedValueOnce({ id: "proj_1" });

      await updateProject("user_1", "proj_1", { color: null });
      expect(mockProject.update).toHaveBeenCalledWith({
        where: { id: "proj_1" },
        data: { name: undefined, color: null },
      });
    });
  });

  describe("deleteProject", () => {
    test("verifies access then deletes", async () => {
      resetMocks();
      await deleteProject("user_1", "proj_1");
      expect(mockVerifyProjectAccess).toHaveBeenCalledWith("user_1", "proj_1");
      expect(mockProject.delete).toHaveBeenCalledWith({ where: { id: "proj_1" } });
    });
  });
});
