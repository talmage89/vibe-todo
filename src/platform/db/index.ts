import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "~/platform/db/generated";

neonConfig.webSocketConstructor = ws;

const getOrInitPrisma = () => {
  if (global.prisma) {
    return global.prisma;
  }

  const prisma = initPrisma();
  global.prisma = prisma;

  return prisma;
};

const initPrisma = () => {
  const adapter = new PrismaNeon({ connectionString: process.env.DB_URL ?? "" });
  return new PrismaClient({ adapter });
};

const getPrisma = () => {
  return process.env.NODE_ENV === "development" ? getOrInitPrisma() : initPrisma();
};

export const db = getPrisma();
