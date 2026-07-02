-- AlterTable: one-time password-setup token (hash + expiry) for bootstrapping
-- an account's first password via an emailed link.
ALTER TABLE "User" ADD COLUMN "setupTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "setupTokenExpiresAt" TIMESTAMP(3);
