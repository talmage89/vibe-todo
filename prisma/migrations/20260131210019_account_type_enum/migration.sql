/*
 Warnings:
 
 - Changed the type of `provider` on the `accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
 
 */
-- CreateEnum
CREATE TYPE "AccountProvider" AS ENUM ('GOOGLE', 'GITHUB');

-- drop all rows, still in dev
DELETE FROM "accounts";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "provider",
  ADD COLUMN "provider" "AccountProvider" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerId_key" ON "accounts"("provider", "providerId");