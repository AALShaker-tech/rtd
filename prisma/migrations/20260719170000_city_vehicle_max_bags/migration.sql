-- Per-city maximum luggage (suitcases) a vehicle class can carry. Additive and
-- nullable; there is no global default, so a null value means no luggage figure
-- is shown for the class in that city.
ALTER TABLE "CityVehiclePricing" ADD COLUMN "maxBags" INTEGER;
