-- Trim stray leading/trailing whitespace from city and airport codes that got
-- in via un-trimmed admin input (e.g. a city saved as " CEQ" with a leading
-- space). City.code / Airport.code changes cascade to the per-city pricing
-- tables and airport lounges via their foreign keys' ON UPDATE CASCADE.
-- Idempotent: only rows whose code differs from its trimmed value are touched.
UPDATE "City" SET "code" = TRIM("code") WHERE "code" <> TRIM("code");
UPDATE "Airport" SET "code" = TRIM("code") WHERE "code" <> TRIM("code");
