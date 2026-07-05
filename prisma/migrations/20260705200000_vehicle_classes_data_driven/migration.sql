-- Make vehicle classes data-driven: widen the CarCategory enum columns to TEXT
-- so admins can define brand-new classes. The USING cast preserves existing
-- values ('VVIP' / 'VIP' / 'ECONOMY') as plain strings.

-- Request.carCategory (NOT NULL, default 'VIP')
ALTER TABLE "Request" ALTER COLUMN "carCategory" DROP DEFAULT;
ALTER TABLE "Request" ALTER COLUMN "carCategory" TYPE TEXT USING "carCategory"::text;
ALTER TABLE "Request" ALTER COLUMN "carCategory" SET DEFAULT 'VIP';

-- JourneyStep.carCategory (nullable)
ALTER TABLE "JourneyStep" ALTER COLUMN "carCategory" TYPE TEXT USING "carCategory"::text;

-- VehicleCategory.category (unique)
ALTER TABLE "VehicleCategory" ALTER COLUMN "category" TYPE TEXT USING "category"::text;

-- CityVehiclePricing.category (part of the unique index)
ALTER TABLE "CityVehiclePricing" ALTER COLUMN "category" TYPE TEXT USING "category"::text;

-- The enum type is no longer referenced by any column.
DROP TYPE "CarCategory";
