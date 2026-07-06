-- AlterTable: presence timestamp for "online" indicators.
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
