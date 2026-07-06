-- Data-driven lounges: a Lounge catalog (name + description) plus AirportLounge
-- (a lounge offered at a specific airport, with its per-airport price). Replaces
-- the static country-based lounge list.

-- CreateTable
CREATE TABLE "Lounge" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Lounge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirportLounge" (
    "id" TEXT NOT NULL,
    "airportCode" TEXT NOT NULL,
    "loungeId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "price" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AirportLounge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AirportLounge_airportCode_loungeId_key" ON "AirportLounge"("airportCode", "loungeId");

-- AddForeignKey
ALTER TABLE "AirportLounge" ADD CONSTRAINT "AirportLounge_airportCode_fkey" FOREIGN KEY ("airportCode") REFERENCES "Airport"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirportLounge" ADD CONSTRAINT "AirportLounge_loungeId_fkey" FOREIGN KEY ("loungeId") REFERENCES "Lounge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Seed the built-in lounges (id = the old code so existing requests that
-- stored loungeType still resolve). Idempotent. ──
INSERT INTO "Lounge" ("id", "nameEn", "nameAr", "sortOrder") VALUES
  ('EXECUTIVE_OFFICE', 'Executive Office', 'المكتب التنفيذي', 1),
  ('MARHABA', 'Marhaba', 'مرحبا', 2),
  ('VIP_LOUNGE', 'VIP Lounge', 'صالة كبار الزوار', 3),
  ('MEET_ASSIST', 'Meet & Assist', 'الاستقبال والمساعدة', 4),
  ('FAST_TRACK', 'Fast Track', 'المسار السريع', 5)
ON CONFLICT ("id") DO NOTHING;

-- ── Backfill AirportLounge so current behaviour is preserved: enable the
-- country-appropriate lounges at each airport (Saudi → Executive Office +
-- Marhaba; international → Meet & Assist + Fast Track), priced from the city's
-- effective lounge price (CityLoungePricing, filled by the prior migration). ──
INSERT INTO "AirportLounge" ("id", "airportCode", "loungeId", "enabled", "price")
SELECT 'bf_al_' || a."code" || '_' || l.code,
       a."code", l.code, true, COALESCE(clp."price", 0)
FROM "Airport" a
JOIN "City" c ON a."cityId" = c."id"
CROSS JOIN (VALUES
  ('EXECUTIVE_OFFICE', 'SA'),
  ('MARHABA', 'SA'),
  ('MEET_ASSIST', 'INTL'),
  ('FAST_TRACK', 'INTL')
) AS l(code, scope)
LEFT JOIN "CityLoungePricing" clp ON clp."cityCode" = c."code" AND clp."loungeType" = l.code
WHERE (l.scope = 'SA' AND COALESCE(a."country", c."country") = 'SA')
   OR (l.scope = 'INTL' AND COALESCE(a."country", c."country") <> 'SA')
ON CONFLICT ("airportCode", "loungeId") DO NOTHING;
