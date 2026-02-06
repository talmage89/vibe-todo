import type { Prisma } from "~/platform/db/generated";
import type { SerializedDate } from "~/types/serialization";

const sectionSelect = {
  id: true,
  name: true,
  position: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SectionSelect;

type PrismaSection = Prisma.SectionGetPayload<{ select: typeof sectionSelect }>;

export type Section = SerializedDate<PrismaSection>;
