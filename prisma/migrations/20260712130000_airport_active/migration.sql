-- Airports can be deactivated (hidden from the customer flow) instead of only
-- deleted, since routes/flight schedules reference airport codes. Additive;
-- existing airports default to active.
ALTER TABLE "Airport" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
