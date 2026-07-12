-- Rename the built-in journey steps to the new customer-facing names. The step
-- codes (behaviour keys) are unchanged; only the display names change. One-time
-- update for already-seeded databases (fresh installs get these from the seed).
UPDATE "ServiceStep" SET "nameEn" = 'Chauffeur from Your Home',            "nameAr" = 'سائقك من بيتك'            WHERE "code" = 'HOME_TO_RIYADH_AIRPORT';
UPDATE "ServiceStep" SET "nameEn" = 'Departure Send-Off — Riyadh',         "nameAr" = 'توديعك في مطار الرياض'   WHERE "code" = 'DEPARTURE_ASSIST_RIYADH';
UPDATE "ServiceStep" SET "nameEn" = 'Arrival Welcome — Destination',       "nameAr" = 'استقبالك في مطار الوجهة' WHERE "code" = 'ARRIVAL_ASSIST_DESTINATION';
UPDATE "ServiceStep" SET "nameEn" = 'Chauffeur to Your Hotel',             "nameAr" = 'سائقك إلى الفندق'         WHERE "code" = 'AIRPORT_TO_HOTEL';
UPDATE "ServiceStep" SET "nameEn" = 'Private Chauffeur During Your Stay',  "nameAr" = 'سائقك الخاص طوال إقامتك' WHERE "code" = 'CHAUFFEUR_DURING_STAY';
UPDATE "ServiceStep" SET "nameEn" = 'Chauffeur to the Airport',            "nameAr" = 'سائقك إلى المطار'         WHERE "code" = 'HOTEL_TO_AIRPORT';
UPDATE "ServiceStep" SET "nameEn" = 'Departure Send-Off — Destination',    "nameAr" = 'توديعك في مطار الوجهة'   WHERE "code" = 'DEPARTURE_ASSIST_RETURN';
UPDATE "ServiceStep" SET "nameEn" = 'Arrival Welcome — Riyadh',            "nameAr" = 'استقبالك في مطار الرياض' WHERE "code" = 'ARRIVAL_ASSIST_RIYADH';
UPDATE "ServiceStep" SET "nameEn" = 'Chauffeur to Your Home',              "nameAr" = 'سائقك إلى بيتك'           WHERE "code" = 'RIYADH_AIRPORT_TO_HOME';
