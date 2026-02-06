import { describe, expect, mock, test } from "bun:test";

const fn = () =>
  mock() as ReturnType<typeof mock> & { mockResolvedValueOnce: (v: unknown) => void };

const mockTag = {
  findMany: fn(),
  findUnique: fn(),
  create: fn(),
  update: fn(),
  delete: fn(),
};

mock.module("~/platform/db", () => ({ db: { tag: mockTag } }));

const { listTags, createTag, updateTag, deleteTag } = await import("../tag-service");
const { ValidationError } = await import("~/platform/auth/errors");

function resetMocks() {
  for (const f of Object.values(mockTag)) f.mockClear();
}

describe("TagService", () => {
  describe("listTags", () => {
    test("queries with correct params", async () => {
      resetMocks();
      mockTag.findMany.mockResolvedValueOnce([]);
      await listTags("proj_1");
      expect(mockTag.findMany).toHaveBeenCalledWith({
        where: { projectId: "proj_1" },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("createTag", () => {
    test("creates tag when name is unique", async () => {
      resetMocks();
      mockTag.findUnique.mockResolvedValueOnce(null);
      mockTag.create.mockResolvedValueOnce({ id: "tag_new" });

      await createTag("proj_1", "Urgent", "#ff0000");
      expect(mockTag.findUnique).toHaveBeenCalledWith({
        where: { name_projectId: { name: "Urgent", projectId: "proj_1" } },
      });
      expect(mockTag.create).toHaveBeenCalledWith({
        data: { name: "Urgent", color: "#ff0000", projectId: "proj_1" },
      });
    });

    test("throws ValidationError when tag name already exists", async () => {
      resetMocks();
      mockTag.findUnique.mockResolvedValueOnce({ id: "tag_existing" });

      await expect(createTag("proj_1", "Bug", "#ff0000")).rejects.toBeInstanceOf(ValidationError);
      expect(mockTag.create).not.toHaveBeenCalled();
    });
  });

  describe("updateTag", () => {
    test("updates tag fields without name change", async () => {
      resetMocks();
      mockTag.update.mockResolvedValueOnce({ id: "tag_1" });

      await updateTag("proj_1", "tag_1", "Bug", { color: "#0000ff" });
      expect(mockTag.findUnique).not.toHaveBeenCalled();
      expect(mockTag.update).toHaveBeenCalledWith({
        where: { id: "tag_1" },
        data: { name: undefined, color: "#0000ff" },
      });
    });

    test("checks uniqueness when name changes", async () => {
      resetMocks();
      mockTag.findUnique.mockResolvedValueOnce(null);
      mockTag.update.mockResolvedValueOnce({ id: "tag_1" });

      await updateTag("proj_1", "tag_1", "Bug", { name: "Defect" });
      expect(mockTag.findUnique).toHaveBeenCalledWith({
        where: { name_projectId: { name: "Defect", projectId: "proj_1" } },
      });
    });

    test("throws when new name already exists", async () => {
      resetMocks();
      mockTag.findUnique.mockResolvedValueOnce({ id: "tag_other" });

      await expect(updateTag("proj_1", "tag_1", "Bug", { name: "Feature" })).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(mockTag.update).not.toHaveBeenCalled();
    });

    test("skips uniqueness check when name unchanged", async () => {
      resetMocks();
      mockTag.update.mockResolvedValueOnce({ id: "tag_1" });

      await updateTag("proj_1", "tag_1", "Bug", { name: "Bug" });
      expect(mockTag.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("deleteTag", () => {
    test("deletes tag by id", async () => {
      resetMocks();
      await deleteTag("tag_1");
      expect(mockTag.delete).toHaveBeenCalledWith({ where: { id: "tag_1" } });
    });
  });
});
