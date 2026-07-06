-- One price per city: the engine now reads prices from the per-city tables
-- only (unset → 0). Backfill every existing city's price sheet with today's
-- EFFECTIVE price so nothing shifts on deploy:
--   effective = city override (if set) → global price → built-in default.
--
-- Strategy: (1) ensure the global tables hold the built-in defaults (custom
-- global prices already set by the admin are preserved via ON CONFLICT DO
-- NOTHING); (2) copy the resulting global values down onto each city (filling
-- NULLs and missing rows, never touching an existing city override). The global
-- tables are left in place, now unused by the engine — a later migration can
-- drop them once this is confirmed in production.
-- Idempotent throughout: deterministic ids + ON CONFLICT DO NOTHING.

-- ── 1. Seed built-in defaults into the global tables (gaps only) ──
INSERT INTO "ServicePricing" ("id", "stepType", "basePrice", "updatedAt") VALUES
  ('bf_sp_HOME_TO_RIYADH_AIRPORT', 'HOME_TO_RIYADH_AIRPORT', 250, now()),
  ('bf_sp_DEPARTURE_ASSIST_RIYADH', 'DEPARTURE_ASSIST_RIYADH', 320, now()),
  ('bf_sp_ARRIVAL_ASSIST_DESTINATION', 'ARRIVAL_ASSIST_DESTINATION', 420, now()),
  ('bf_sp_AIRPORT_TO_HOTEL', 'AIRPORT_TO_HOTEL', 380, now()),
  ('bf_sp_CHAUFFEUR_DURING_STAY', 'CHAUFFEUR_DURING_STAY', 650, now()),
  ('bf_sp_HOTEL_TO_AIRPORT', 'HOTEL_TO_AIRPORT', 380, now()),
  ('bf_sp_DEPARTURE_ASSIST_RETURN', 'DEPARTURE_ASSIST_RETURN', 460, now()),
  ('bf_sp_ARRIVAL_ASSIST_RIYADH', 'ARRIVAL_ASSIST_RIYADH', 420, now()),
  ('bf_sp_RIYADH_AIRPORT_TO_HOME', 'RIYADH_AIRPORT_TO_HOME', 250, now())
ON CONFLICT ("stepType") DO NOTHING;

-- Per-class car defaults (base × class multiplier: VVIP 2.0, VIP 1.4, ECONOMY 1.0).
INSERT INTO "ServiceClassPrice" ("id", "stepType", "category", "price") VALUES
  ('bf_scp_HOME_TO_RIYADH_AIRPORT_VVIP', 'HOME_TO_RIYADH_AIRPORT', 'VVIP', 500),
  ('bf_scp_HOME_TO_RIYADH_AIRPORT_VIP', 'HOME_TO_RIYADH_AIRPORT', 'VIP', 350),
  ('bf_scp_HOME_TO_RIYADH_AIRPORT_ECONOMY', 'HOME_TO_RIYADH_AIRPORT', 'ECONOMY', 250),
  ('bf_scp_AIRPORT_TO_HOTEL_VVIP', 'AIRPORT_TO_HOTEL', 'VVIP', 760),
  ('bf_scp_AIRPORT_TO_HOTEL_VIP', 'AIRPORT_TO_HOTEL', 'VIP', 532),
  ('bf_scp_AIRPORT_TO_HOTEL_ECONOMY', 'AIRPORT_TO_HOTEL', 'ECONOMY', 380),
  ('bf_scp_CHAUFFEUR_DURING_STAY_VVIP', 'CHAUFFEUR_DURING_STAY', 'VVIP', 1300),
  ('bf_scp_CHAUFFEUR_DURING_STAY_VIP', 'CHAUFFEUR_DURING_STAY', 'VIP', 910),
  ('bf_scp_CHAUFFEUR_DURING_STAY_ECONOMY', 'CHAUFFEUR_DURING_STAY', 'ECONOMY', 650),
  ('bf_scp_HOTEL_TO_AIRPORT_VVIP', 'HOTEL_TO_AIRPORT', 'VVIP', 760),
  ('bf_scp_HOTEL_TO_AIRPORT_VIP', 'HOTEL_TO_AIRPORT', 'VIP', 532),
  ('bf_scp_HOTEL_TO_AIRPORT_ECONOMY', 'HOTEL_TO_AIRPORT', 'ECONOMY', 380),
  ('bf_scp_RIYADH_AIRPORT_TO_HOME_VVIP', 'RIYADH_AIRPORT_TO_HOME', 'VVIP', 500),
  ('bf_scp_RIYADH_AIRPORT_TO_HOME_VIP', 'RIYADH_AIRPORT_TO_HOME', 'VIP', 350),
  ('bf_scp_RIYADH_AIRPORT_TO_HOME_ECONOMY', 'RIYADH_AIRPORT_TO_HOME', 'ECONOMY', 250)
ON CONFLICT ("stepType", "category") DO NOTHING;

INSERT INTO "LoungePricing" ("id", "loungeType", "price") VALUES
  ('bf_lp_EXECUTIVE_OFFICE', 'EXECUTIVE_OFFICE', 320),
  ('bf_lp_MARHABA', 'MARHABA', 240),
  ('bf_lp_VIP_LOUNGE', 'VIP_LOUNGE', 300),
  ('bf_lp_MEET_ASSIST', 'MEET_ASSIST', 180),
  ('bf_lp_FAST_TRACK', 'FAST_TRACK', 200)
ON CONFLICT ("loungeType") DO NOTHING;

-- ── 2. Push the effective global values down onto every city ──

-- Car per-class: fill any (city × service × class) the city doesn't already have.
INSERT INTO "CityServiceClassPrice" ("id", "cityCode", "stepType", "category", "price")
SELECT 'bf_cscp_' || c.code || '_' || scp."stepType" || '_' || scp."category",
       c.code, scp."stepType", scp."category", scp."price"
FROM "City" c CROSS JOIN "ServiceClassPrice" scp
ON CONFLICT ("cityCode", "stepType", "category") DO NOTHING;

-- Assistance/base: existing city rows with a NULL price meant "use the global",
-- so resolve them to the global value; then fill missing (city × service) rows.
UPDATE "CityServicePricing" cs
SET "price" = g."basePrice"
FROM "ServicePricing" g
WHERE cs."stepType" = g."stepType" AND cs."price" IS NULL;

INSERT INTO "CityServicePricing" ("id", "cityCode", "stepType", "price", "enabled")
SELECT 'bf_csp_' || c.code || '_' || g."stepType", c.code, g."stepType", g."basePrice", true
FROM "City" c CROSS JOIN "ServicePricing" g
ON CONFLICT ("cityCode", "stepType") DO NOTHING;

-- Lounges: same NULL-resolve + fill.
UPDATE "CityLoungePricing" cl
SET "price" = g."price"
FROM "LoungePricing" g
WHERE cl."loungeType" = g."loungeType" AND cl."price" IS NULL;

INSERT INTO "CityLoungePricing" ("id", "cityCode", "loungeType", "price", "enabled")
SELECT 'bf_clp_' || c.code || '_' || g."loungeType", c.code, g."loungeType", g."price", true
FROM "City" c CROSS JOIN "LoungePricing" g
ON CONFLICT ("cityCode", "loungeType") DO NOTHING;
