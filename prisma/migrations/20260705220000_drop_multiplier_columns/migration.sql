-- Drop the pricing multiplier columns/table now that pricing is direct
-- per-(service × class) amounts. Non-destructive to live pricing: nothing reads
-- these anymore.

ALTER TABLE "VehicleCategory" DROP COLUMN "priceMultiplier";
ALTER TABLE "City" DROP COLUMN "multiplier";
ALTER TABLE "CityVehiclePricing" DROP COLUMN "multiplier";
ALTER TABLE "JourneyStep" DROP COLUMN "vehicleMultiplier";

DROP TABLE "DestinationPricing";
