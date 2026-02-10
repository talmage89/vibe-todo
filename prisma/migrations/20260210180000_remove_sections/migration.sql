-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_sectionId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "tasks_sectionId_idx";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "sectionId";

-- DropTable
DROP TABLE IF EXISTS "sections";
