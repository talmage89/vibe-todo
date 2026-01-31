import type { PrismaClient } from "~/platform/db/generated";

declare global {
  var prisma: PrismaClient | undefined;
}
