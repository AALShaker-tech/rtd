-- Per-city override of a vehicle class's "example models" text. Additive and
-- nullable; a null/empty value falls back to VehicleCategory.exampleModels.
ALTER TABLE "CityVehiclePricing" ADD COLUMN "exampleModels" TEXT;
