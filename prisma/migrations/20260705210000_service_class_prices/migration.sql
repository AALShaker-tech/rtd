-- Direct per-(service × class) pricing (no multipliers). Additive: the old
-- multiplier columns (City.multiplier, VehicleCategory.priceMultiplier,
-- CityVehiclePricing.multiplier) are left in place but are no longer read.

-- CreateTable
CREATE TABLE "ServiceClassPrice" (
    "id" TEXT NOT NULL,
    "stepType" "StepType" NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "ServiceClassPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityServiceClassPrice" (
    "id" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "stepType" "StepType" NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "CityServiceClassPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceClassPrice_stepType_category_key" ON "ServiceClassPrice"("stepType", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CityServiceClassPrice_cityCode_stepType_category_key" ON "CityServiceClassPrice"("cityCode", "stepType", "category");

-- AddForeignKey
ALTER TABLE "CityServiceClassPrice" ADD CONSTRAINT "CityServiceClassPrice_cityCode_fkey" FOREIGN KEY ("cityCode") REFERENCES "City"("code") ON DELETE CASCADE ON UPDATE CASCADE;
