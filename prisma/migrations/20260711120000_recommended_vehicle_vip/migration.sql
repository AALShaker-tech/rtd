-- Exactly one recommended vehicle tier. Deployed data had the "Recommended"
-- badge on VVIP while the VIP copy already read "our recommended choice for most
-- journeys" — a contradiction. Make VIP the single recommended tier (matches the
-- built-in default in domain.ts). Idempotent.
UPDATE "VehicleCategory" SET "isRecommended" = ("category" = 'VIP');
