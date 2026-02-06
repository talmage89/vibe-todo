import { ValidationError } from "~/platform/auth/errors";
import { db } from "~/platform/db";

export async function listTags(projectId: string) {
  return db.tag.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });
}

export async function createTag(projectId: string, name: string, color: string) {
  const existing = await db.tag.findUnique({
    where: { name_projectId: { name, projectId } },
  });

  if (existing) {
    throw new ValidationError("A tag with this name already exists in this project");
  }

  return db.tag.create({
    data: { name, color, projectId },
  });
}

type UpdateTagData = {
  name?: string;
  color?: string;
};

export async function updateTag(
  projectId: string,
  tagId: string,
  currentName: string,
  data: UpdateTagData,
) {
  if (data.name !== undefined && data.name !== currentName) {
    const existing = await db.tag.findUnique({
      where: { name_projectId: { name: data.name, projectId } },
    });

    if (existing) {
      throw new ValidationError("A tag with this name already exists in this project");
    }
  }

  return db.tag.update({
    where: { id: tagId },
    data: {
      name: data.name,
      color: data.color,
    },
  });
}

export async function deleteTag(tagId: string) {
  await db.tag.delete({ where: { id: tagId } });
}
