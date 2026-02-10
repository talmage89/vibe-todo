import type { Prisma } from "~/platform/db/generated";
import type { SerializedDate } from "~/types/serialization";

const projectSelect = {
  id: true,
  name: true,
  color: true,
  defaultView: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

type PrismaProject = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

export type Project = SerializedDate<PrismaProject>;
