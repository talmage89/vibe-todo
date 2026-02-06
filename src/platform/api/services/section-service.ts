import { db } from "~/platform/db";
import { getNextSectionPosition, reorderSections } from "./position";

export async function listSections(projectId: string) {
  return db.section.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
  });
}

export async function createSection(projectId: string, name: string) {
  const position = await getNextSectionPosition(projectId);

  return db.section.create({
    data: { name, position, projectId },
  });
}

export async function updateSection(sectionId: string, data: { name?: string }) {
  return db.section.update({
    where: { id: sectionId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
    },
  });
}

export async function deleteSection(sectionId: string) {
  await db.section.delete({ where: { id: sectionId } });
}

export async function reorderProjectSections(projectId: string, sectionIds: string[]) {
  await reorderSections(projectId, sectionIds);

  return db.section.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
  });
}
