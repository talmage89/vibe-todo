-- AlterTable: change default view from LIST to KANBAN
ALTER TABLE "users" ALTER COLUMN "defaultView" SET DEFAULT 'KANBAN';
ALTER TABLE "projects" ALTER COLUMN "defaultView" SET DEFAULT 'KANBAN';

-- Update existing rows to use KANBAN where still set to LIST
UPDATE "users" SET "defaultView" = 'KANBAN' WHERE "defaultView" = 'LIST';
UPDATE "projects" SET "defaultView" = 'KANBAN' WHERE "defaultView" = 'LIST';
