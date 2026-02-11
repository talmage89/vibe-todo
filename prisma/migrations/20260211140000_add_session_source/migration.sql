-- CreateEnum
CREATE TYPE "SessionSource" AS ENUM ('WEB', 'CLI');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "source" "SessionSource" NOT NULL DEFAULT 'WEB',
ADD COLUMN "label" TEXT;
