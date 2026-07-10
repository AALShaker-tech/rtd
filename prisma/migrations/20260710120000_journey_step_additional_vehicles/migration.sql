-- Additional vehicles per journey step. When one vehicle can't carry the whole
-- party, the customer keeps their chosen vehicle and adds others of any class.
-- Stored as JSON: [{ "carCategory": "VIP", "passengers": 4, "bags": 3 }].
-- Nullable & additive — existing single-vehicle steps are unaffected.
ALTER TABLE "JourneyStep" ADD COLUMN "additionalVehicles" JSONB;
