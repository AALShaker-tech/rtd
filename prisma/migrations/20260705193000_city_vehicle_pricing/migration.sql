-- CreateTable
CREATE TABLE "CityVehiclePricing" (
    "id" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "category" "CarCategory" NOT NULL,
    "multiplier" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CityVehiclePricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CityVehiclePricing_cityCode_category_key" ON "CityVehiclePricing"("cityCode", "category");

-- AddForeignKey
ALTER TABLE "CityVehiclePricing" ADD CONSTRAINT "CityVehiclePricing_cityCode_fkey" FOREIGN KEY ("cityCode") REFERENCES "City"("code") ON DELETE CASCADE ON UPDATE CASCADE;
