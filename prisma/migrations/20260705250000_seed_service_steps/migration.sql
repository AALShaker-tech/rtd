-- Materialise the 9 built-in journey services as real, editable ServiceStep
-- rows (previously they existed only as the in-code fallback catalog). Runs on
-- deploy via `prisma migrate deploy`. Idempotent: ON CONFLICT (code) DO NOTHING,
-- so re-running never duplicates and never overwrites admin edits.

INSERT INTO "ServiceStep" (
  "id", "code", "nameEn", "nameAr", "shortNameEn", "shortNameAr",
  "descriptionEn", "descriptionAr", "sortOrder", "cityScope",
  "featTransfer", "featAssistance", "featFlight", "featHotel", "featHome", "featChauffeur",
  "createsDriverTask", "active"
) VALUES
  ('seed_HOME_TO_RIYADH_AIRPORT', 'HOME_TO_RIYADH_AIRPORT',
   'Home to Riyadh Airport', 'من المنزل إلى مطار الرياض',
   'Home → Riyadh Airport', 'المنزل ← مطار الرياض',
   'Private pick-up from your doorstep to King Khalid International Airport.',
   'توصيل خاص من باب منزلك إلى مطار الملك خالد الدولي.',
   1, 'RIYADH', true, false, true, false, true, false, true, true),

  ('seed_DEPARTURE_ASSIST_RIYADH', 'DEPARTURE_ASSIST_RIYADH',
   'Departure Assistance at Riyadh Airport', 'خدمة المغادرة في مطار الرياض',
   'Riyadh Departure Assist', 'مساعدة المغادرة – الرياض',
   'Executive Office or Marhaba lounge assistance at Riyadh Airport.',
   'خدمة المكتب التنفيذي أو مرحبا في مطار الرياض.',
   2, 'RIYADH', false, true, true, false, false, false, false, true),

  ('seed_ARRIVAL_ASSIST_DESTINATION', 'ARRIVAL_ASSIST_DESTINATION',
   'Arrival Assistance at Destination', 'خدمة الوصول في الوجهة',
   'Destination Arrival Assist', 'مساعدة الوصول – الوجهة',
   'Meet & Assist or Fast Track on arrival in London, Paris, Dubai or Cairo.',
   'الاستقبال والمساعدة أو المسار السريع عند الوصول في لندن أو باريس أو دبي أو القاهرة.',
   3, 'DESTINATION', false, true, true, false, false, false, false, true),

  ('seed_AIRPORT_TO_HOTEL', 'AIRPORT_TO_HOTEL',
   'Airport to Hotel Transfer', 'التوصيل من المطار إلى الفندق',
   'Airport → Hotel', 'المطار ← الفندق',
   'Seamless private transfer from the destination airport to your hotel.',
   'توصيل خاص وسلس من مطار الوجهة إلى فندقك.',
   4, 'DESTINATION', true, false, false, true, false, false, true, true),

  ('seed_CHAUFFEUR_DURING_STAY', 'CHAUFFEUR_DURING_STAY',
   'Chauffeur Service During Stay', 'خدمة السائق الخاص أثناء الإقامة',
   'Chauffeur During Stay', 'سائق خاص أثناء الإقامة',
   'A dedicated chauffeur for your days abroad — by the day and hours you choose.',
   'سائق خاص مخصّص طوال أيام إقامتك — بالأيام والساعات التي تختارها.',
   5, 'DESTINATION', false, false, false, false, false, true, true, true),

  ('seed_HOTEL_TO_AIRPORT', 'HOTEL_TO_AIRPORT',
   'Hotel to Airport Return Transfer', 'التوصيل من الفندق إلى المطار للعودة',
   'Hotel → Airport', 'الفندق ← المطار',
   'Private transfer from your hotel back to the airport for your return flight.',
   'توصيل خاص من فندقك إلى المطار لرحلة العودة.',
   6, 'DESTINATION', true, false, false, true, false, false, true, true),

  ('seed_DEPARTURE_ASSIST_RETURN', 'DEPARTURE_ASSIST_RETURN',
   'Departure Assistance at Return Airport', 'خدمة المغادرة في مطار العودة',
   'Return Departure Assist', 'مساعدة المغادرة – العودة',
   'Meet & Assist or Fast Track for your departure from the destination.',
   'الاستقبال والمساعدة أو المسار السريع لمغادرتك من الوجهة.',
   7, 'DESTINATION', false, true, true, false, false, false, false, true),

  ('seed_ARRIVAL_ASSIST_RIYADH', 'ARRIVAL_ASSIST_RIYADH',
   'Arrival Assistance at Riyadh Airport', 'خدمة الوصول في مطار الرياض',
   'Riyadh Arrival Assist', 'مساعدة الوصول – الرياض',
   'Executive Office, Meet & Assist and arrival assistance back home.',
   'المكتب التنفيذي، الاستقبال والمساعدة وخدمة الوصول عند عودتك.',
   8, 'RIYADH', false, true, true, false, false, false, false, true),

  ('seed_RIYADH_AIRPORT_TO_HOME', 'RIYADH_AIRPORT_TO_HOME',
   'Riyadh Airport to Home Transfer', 'التوصيل من مطار الرياض إلى المنزل',
   'Riyadh Airport → Home', 'مطار الرياض ← المنزل',
   'The final leg — a private transfer from the airport to your door.',
   'المرحلة الأخيرة — توصيل خاص من المطار إلى باب منزلك.',
   9, 'RIYADH', true, false, false, false, true, false, true, true)
ON CONFLICT ("code") DO NOTHING;
