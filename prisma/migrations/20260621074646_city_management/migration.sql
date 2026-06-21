-- AlterTable
ALTER TABLE "City" ADD COLUMN     "approxDurationMinutes" INTEGER,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "isOrigin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "CityServicePricing" (
    "id" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "stepType" "StepType" NOT NULL,
    "price" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CityServicePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityLoungePricing" (
    "id" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "loungeType" TEXT NOT NULL,
    "price" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CityLoungePricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CityServicePricing_cityCode_stepType_key" ON "CityServicePricing"("cityCode", "stepType");

-- CreateIndex
CREATE UNIQUE INDEX "CityLoungePricing_cityCode_loungeType_key" ON "CityLoungePricing"("cityCode", "loungeType");

-- AddForeignKey
ALTER TABLE "CityServicePricing" ADD CONSTRAINT "CityServicePricing_cityCode_fkey" FOREIGN KEY ("cityCode") REFERENCES "City"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityLoungePricing" ADD CONSTRAINT "CityLoungePricing_cityCode_fkey" FOREIGN KEY ("cityCode") REFERENCES "City"("code") ON DELETE CASCADE ON UPDATE CASCADE;
