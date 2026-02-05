-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DefaultView" AS ENUM ('LIST', 'KANBAN');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "defaultView" "DefaultView" NOT NULL DEFAULT 'LIST',
  ADD COLUMN "defaultProjectId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_defaultProjectId_fkey" FOREIGN KEY ("defaultProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
