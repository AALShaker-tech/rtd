-- Airport lounge / assistance services can be priced per person or as a flat
-- group total. Additive: existing rows default to PER_PERSON (unchanged
-- behaviour, since totals were already effectively per-booking).

-- CreateEnum
CREATE TYPE "LoungePriceMode" AS ENUM ('PER_PERSON', 'GROUP');

-- AlterTable
ALTER TABLE "AirportLounge"
  ADD COLUMN "priceMode" "LoungePriceMode" NOT NULL DEFAULT 'PER_PERSON',
  ADD COLUMN "groupCapacity" INTEGER;
