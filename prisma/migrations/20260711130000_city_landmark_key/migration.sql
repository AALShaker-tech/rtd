-- Admin-chosen landmark icon per city (preset key, e.g. "eiffel-tower").
-- Nullable & additive; unset cities fall back to a city-code default then a
-- generic monument (see CityLandmark).
ALTER TABLE "City" ADD COLUMN "landmarkKey" TEXT;
