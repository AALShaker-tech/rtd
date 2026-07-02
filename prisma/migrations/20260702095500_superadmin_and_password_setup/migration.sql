-- AlterEnum
-- Adds the SUPERADMIN role. Safe inside Prisma's migration transaction because
-- the new value is not referenced elsewhere in this migration.
ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "mustSetPassword" BOOLEAN NOT NULL DEFAULT false;
