-- Separate journey steps from pricing: transfer prices move off the individual
-- directional step codes onto a single city-owned pricing key per transfer, so
-- a price is entered once per city and applies both directions.
--
--   HOME_TO_RIYADH_AIRPORT | RIYADH_AIRPORT_TO_HOME → HOME_AIRPORT_TRANSFER
--   AIRPORT_TO_HOTEL       | HOTEL_TO_AIRPORT        → AIRPORT_HOTEL_TRANSFER
--   CHAUFFEUR_DURING_STAY  (already keyed by itself — untouched)
--
-- CityServiceClassPrice only ever holds car/transfer prices, so no assistance
-- rows are affected. The outbound direction wins on conflict; the reverse fills
-- any city that only priced the return leg.

-- Home ⇄ Airport — outbound first, then reverse fills the gaps.
INSERT INTO "CityServiceClassPrice" ("id", "cityCode", "stepType", "category", "price")
SELECT 'bf_hat_o_' || "cityCode" || '_' || "category", "cityCode", 'HOME_AIRPORT_TRANSFER', "category", "price"
FROM "CityServiceClassPrice" WHERE "stepType" = 'HOME_TO_RIYADH_AIRPORT'
ON CONFLICT ("cityCode", "stepType", "category") DO NOTHING;

INSERT INTO "CityServiceClassPrice" ("id", "cityCode", "stepType", "category", "price")
SELECT 'bf_hat_r_' || "cityCode" || '_' || "category", "cityCode", 'HOME_AIRPORT_TRANSFER', "category", "price"
FROM "CityServiceClassPrice" WHERE "stepType" = 'RIYADH_AIRPORT_TO_HOME'
ON CONFLICT ("cityCode", "stepType", "category") DO NOTHING;

-- Airport ⇄ Hotel — outbound first, then reverse fills the gaps.
INSERT INTO "CityServiceClassPrice" ("id", "cityCode", "stepType", "category", "price")
SELECT 'bf_aht_o_' || "cityCode" || '_' || "category", "cityCode", 'AIRPORT_HOTEL_TRANSFER', "category", "price"
FROM "CityServiceClassPrice" WHERE "stepType" = 'AIRPORT_TO_HOTEL'
ON CONFLICT ("cityCode", "stepType", "category") DO NOTHING;

INSERT INTO "CityServiceClassPrice" ("id", "cityCode", "stepType", "category", "price")
SELECT 'bf_aht_r_' || "cityCode" || '_' || "category", "cityCode", 'AIRPORT_HOTEL_TRANSFER', "category", "price"
FROM "CityServiceClassPrice" WHERE "stepType" = 'HOTEL_TO_AIRPORT'
ON CONFLICT ("cityCode", "stepType", "category") DO NOTHING;

-- Drop the now-superseded directional rows.
DELETE FROM "CityServiceClassPrice"
WHERE "stepType" IN (
  'HOME_TO_RIYADH_AIRPORT', 'RIYADH_AIRPORT_TO_HOME',
  'AIRPORT_TO_HOTEL', 'HOTEL_TO_AIRPORT'
);

-- Assistance base prices duplicated the per-airport lounge prices; airport
-- services are now lounge-priced only. Drop the redundant assist base rows.
DELETE FROM "CityServicePricing"
WHERE "stepType" IN (
  'DEPARTURE_ASSIST_RIYADH', 'ARRIVAL_ASSIST_DESTINATION',
  'DEPARTURE_ASSIST_RETURN', 'ARRIVAL_ASSIST_RIYADH'
);
