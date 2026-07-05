-- Make journey services (steps) data-driven: an admin-managed ServiceStep
-- catalog, and stepType columns widened from the StepType enum to TEXT so new
-- service codes can be added. USING casts preserve existing values.

-- CreateTable
CREATE TABLE "ServiceStep" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "shortNameEn" TEXT NOT NULL,
    "shortNameAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "cityScope" TEXT NOT NULL DEFAULT 'DESTINATION',
    "featTransfer" BOOLEAN NOT NULL DEFAULT false,
    "featAssistance" BOOLEAN NOT NULL DEFAULT false,
    "featFlight" BOOLEAN NOT NULL DEFAULT false,
    "featHotel" BOOLEAN NOT NULL DEFAULT false,
    "featHome" BOOLEAN NOT NULL DEFAULT false,
    "featChauffeur" BOOLEAN NOT NULL DEFAULT false,
    "createsDriverTask" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceStep_code_key" ON "ServiceStep"("code");

-- Widen stepType columns from the enum to TEXT.
ALTER TABLE "JourneyStep" ALTER COLUMN "stepType" TYPE TEXT USING "stepType"::text;
ALTER TABLE "ServicePricing" ALTER COLUMN "stepType" TYPE TEXT USING "stepType"::text;
ALTER TABLE "ServiceClassPrice" ALTER COLUMN "stepType" TYPE TEXT USING "stepType"::text;
ALTER TABLE "CityServicePricing" ALTER COLUMN "stepType" TYPE TEXT USING "stepType"::text;
ALTER TABLE "CityServiceClassPrice" ALTER COLUMN "stepType" TYPE TEXT USING "stepType"::text;

DROP TYPE "StepType";
