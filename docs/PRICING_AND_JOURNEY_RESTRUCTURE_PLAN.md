# Journey-Steps & City-Pricing Restructure — Review + Implementation Plan

_Status: proposal for approval. No production code changed yet._
_Source: `prep_users.docx` (client brief, Riyadh pricing screenshots) + review of the current codebase._

This document reviews the client brief against the current implementation, records the
decisions already agreed, and lays out a concrete, staged implementation plan.

---

## 1. Goal in one paragraph

Stop pricing services on **directional journey steps** (the source of the duplicate
data the client complained about) and move every price onto the **city** it belongs to.
Journey steps become a small, city-agnostic catalogue that is rendered to the customer
with the real city names; the customer-facing page count and price presentation stay
the same. Airport services (lounges) keep their per-airport enable + price, and gain a
**per-person / per-group pricing mode** and a **per-service EN/AR description**.

---

## 2. What the brief asks for (decoded)

**A. Current problems (all on the Riyadh page in Figures 1–2):**

| Complaint in the brief | Root cause in the data model |
|---|---|
| "Departure Airport Service = 320" duplicates the lounge prices | The `320` is really the Executive-Office lounge price, but it's also entered as a `DEPARTURE_ASSIST_RIYADH` **step** price |
| "Arrival at Destination = 430" is under Riyadh but belongs to the destination | `ARRIVAL_ASSIST_DESTINATION` is a destination-scoped step priced on the Riyadh page |
| Airport→Home should equal Home→Airport | `HOME_TO_RIYADH_AIRPORT` and `RIYADH_AIRPORT_TO_HOME` are two step types with independent prices |
| Airport→Hotel belongs to the destination, not Riyadh | `AIRPORT_TO_HOTEL` is destination-scoped but shown/priced on Riyadh |
| Arrival-at-Riyadh ≈ Departure-at-Riyadh | Both are just "Riyadh airport lounge services", modelled as two separate assist steps |

**B. Target journey steps** (city-agnostic, two groups + chauffeur):

- **Departure group**
  1. Home → Departure-Airport transfer
  2. Departure-Airport services
- **Arrival group**
  3. Arrival-Airport services
  4. Arrival-Airport → Destination transfer
- **Private chauffeur during stay**

Rendered with real names, e.g. Riyadh → Cairo: _Home → Riyadh Airport_, _Riyadh Airport
Services_, _Cairo Airport Services_, _Cairo Airport → Hotel_, _Chauffeur during stay_.
The **return legs still show to the customer** (same page count) but draw their prices
from the same city-owned values as their outbound mirror.

**C. City pricing** — each city owns only its own data:
- Its airports and airport services (Executive Office, Marhaba, Fast Track, VIP Lounge…).
- One **airport-transfer price per vehicle class**, applied **both directions** (Home↔Airport
  for the origin city, Airport↔Hotel for a destination city).
- **Chauffeur** price, offered only when the city is the destination.

**D. Airport lounges** — enable + price per airport, **plus**:
- A **pricing mode**: _per person_ (× passengers) or _group_ (flat total, optional capacity).
- A **per-service EN/AR description** the admin fills so the customer gets a brief
  ("Executive Office", "VIP Lounge", …).

---

## 3. Decisions locked (from review Q&A)

1. **Deliverable:** written plan first (this document), then implement on approval.
2. **Transfer model:** one price per city per vehicle class, used **both directions**.
   Local endpoint is Home for the origin city, Hotel for a destination city.
3. **Lounge pricing:** add a **pricing mode per lounge-per-airport** — _per person_
   multiplies by passenger count; _group_ is a flat total (optional capacity).
4. **Description:** the brief's "description" is the **per-service** brief (Executive
   Office / VIP Lounge). The `Lounge` model already carries EN/AR descriptions per
   service — we reuse and surface those, and expose them for editing in the airport
   section (see §5.4 for the global-vs-per-airport nuance).

---

## 4. How the current code maps to the target (gap analysis)

| Concern | Today | Target | Work |
|---|---|---|---|
| Step catalogue | 9 directional steps in `src/lib/domain.ts` `STEPS` + `ServiceStep` rows | 5 city-agnostic steps (2 groups + chauffeur) | Rewrite `STEPS`, `ServiceStep` seed, `cityScope`/features |
| Transfer price | Per `(stepType × class)` via `CityServiceClassPrice`, distinct per direction | Per `(city × transfer-kind × class)`, both directions | Collapse to one transfer service per city; engine reads it for outbound + return |
| Assist/lounge price | `CityServicePricing` base price **and** per-airport `AirportLounge.price` (duplicate) | Per-airport `AirportLounge` only | Drop the assist "base price" step-pricing path |
| Lounge mode/desc | `AirportLounge.price` only; `Lounge.descriptionEn/Ar` exists but not shown in airport UI | + `priceMode`, `groupCapacity`, surfaced description | Schema + engine + UI |
| Return legs | Separate step types, mirrored via `RETURN_MIRROR` in `journeyStore` | Same customer-visible legs, price pulled from the outbound city value | Keep mirror UX; repoint pricing |
| Customer pages | One page/section per step | **Unchanged** | Keep flow; only relabel/regroup |

Key files in scope:
- `prisma/schema.prisma`, `prisma/seed.ts`, new migration
- `src/lib/domain.ts` (`STEPS`, defaults), `src/lib/steps.ts`, `src/lib/catalog.ts`
- `src/lib/pricing.ts` (+ `pricing.test.ts`), `src/server/services/pricing.service.ts`
- `src/store/journeyStore.ts` (`RETURN_MIRROR`, step build), journey UI under `src/app/(site)/journey`
- `src/app/admin/(dash)/cities/CitiesManager.tsx`, `src/app/admin/(dash)/services`, `src/app/admin/(dash)/lounges`
- `src/server/actions/city.actions.ts`, `lounge.actions.ts`, `pricing.actions.ts`
- i18n strings in `src/i18n`

---

## 5. Implementation plan (staged)

Each stage is independently reviewable and leaves the app runnable.

### Stage 1 — Data model

Schema changes in `prisma/schema.prisma`:

1. **Lounge pricing mode + capacity** on `AirportLounge`:
   ```prisma
   enum LoungePriceMode { PER_PERSON GROUP }
   // on AirportLounge:
   priceMode     LoungePriceMode @default(PER_PERSON)
   groupCapacity Int?            // max pax covered by the flat GROUP price (null = unlimited)
   ```
2. **Per-service description** — reuse existing `Lounge.descriptionEn/descriptionAr`.
   (Optional per-airport override is deferred; see §7.)
3. **City-owned transfer price** — reuse the existing `CityServiceClassPrice`
   `(cityCode, stepType, category)` table but key it on the **new** collapsed transfer
   step codes (`HOME_AIRPORT_TRANSFER`, `AIRPORT_HOTEL_TRANSFER`) instead of the 4 old
   directional codes. No new table needed.
4. Chauffeur stays on `CityServiceClassPrice` under `CHAUFFEUR_DURING_STAY`.

Add a Prisma migration + a data backfill script (Stage 2).

### Stage 2 — Step catalogue + data migration

1. Rewrite `STEPS` in `src/lib/domain.ts` to the 5 city-agnostic codes with a `group`
   field (`DEPARTURE` | `ARRIVAL` | `STAY`) and correct `cityScope`:
   - `HOME_AIRPORT_TRANSFER` (ANY, transfer+home)
   - `DEPARTURE_AIRPORT_SERVICES` (ANY, assistance)
   - `ARRIVAL_AIRPORT_SERVICES` (ANY, assistance)
   - `AIRPORT_HOTEL_TRANSFER` (ANY, transfer+hotel)
   - `CHAUFFEUR_DURING_STAY` (DESTINATION, chauffeur)
2. Update `ServiceStep` seed + add a `group` column.
3. **Backfill migration** (idempotent script under `scripts/`):
   - Map old `CityServiceClassPrice` rows → new transfer codes
     (`HOME_TO_RIYADH_AIRPORT`,`RIYADH_AIRPORT_TO_HOME` → `HOME_AIRPORT_TRANSFER`;
     `AIRPORT_TO_HOTEL`,`HOTEL_TO_AIRPORT` → `AIRPORT_HOTEL_TRANSFER`). On conflict keep
     the max (or the outbound value) and log.
   - Drop the assist step prices (`*_ASSIST_*`) — those move to per-airport lounges.
   - Preserve existing `AirportLounge` prices as-is (default `priceMode = PER_PERSON`).

### Stage 3 — Pricing engine

`src/lib/pricing.ts` + `pricing.service.ts`:
1. Transfer steps read `cityServiceClassPrices[city][transferCode][class]` (both directions
   resolve to the same city value — return legs already carry the right `city`).
2. Assist steps price **only** from the per-airport lounge (remove the
   `cityServicePrices` base-price fallback for assist steps).
3. Lounge total respects `priceMode`:
   - `PER_PERSON`: `price × passengers`
   - `GROUP`: flat `price` (if `groupCapacity` set and pax exceeds it, add another group
     unit — confirm rounding rule with client during build).
4. Extend `PricingConfig` (`airportLoungePrices[airport][loungeId]` → `{ price, mode,
   capacity }`) and update `getPricingConfig`.
5. Update `pricing.test.ts` for the new rules.

### Stage 4 — Customer flow (no visible page change)

`src/store/journeyStore.ts` + journey UI:
1. Rebuild the step list from the 5 new codes, expanded per trip into the visible legs
   (departure + destination + return-mirror) so the **page count is unchanged**.
2. Repoint `RETURN_MIRROR` to the new codes; return legs reuse the outbound city price.
3. Render group headers ("Departure", "Arrival") with real city names; keep the same
   `JourneySummary` price presentation.

### Stage 5 — Admin UI

1. **Cities page** (`CitiesManager.tsx`):
   - Replace the 4 directional transfer rows with **two** transfer rows
     (Home↔Airport, Airport↔Hotel), each per-class, labelled "both directions".
   - Remove the assist "base price" rows (now priced per airport lounge).
   - Show chauffeur per-class only when the city can be a destination.
2. **Airport lounges section**: add the **mode** selector (per-person / group),
   optional **capacity**, and an **EN/AR description** editor per service.
3. **Services catalogue** (`/admin/services`): reflect the 5-step model + `group`.

### Stage 6 — Seed, i18n, validation, tests

1. Update `prisma/seed.ts` (steps, sample city prices, lounge descriptions/modes).
2. Add/adjust EN/AR strings in `src/i18n`.
3. Update journey validation (`src/lib/validation/journey.ts`) and store/pricing tests.
4. Manual E2E pass of a Riyadh→Cairo booking + admin price edit.

---

## 6. Customer-facing invariants (must not regress)

- Same number of booking pages / sections.
- Same price presentation (per-leg line items + total).
- Return journey still visible with correct, non-duplicated prices.
- Existing in-flight requests keep their persisted `JourneyStep` prices (we don't
  retro-price historical requests; backfill only touches the admin price catalogue).

---

## 7. Open items to confirm during build (non-blocking)

1. **Group-price overflow:** when `passengers > groupCapacity`, is it 1 extra flat unit,
   proportional, or "contact us"? (Assumed: one extra unit, ceil.)
2. **Description scope:** global per-service description is planned. If the same lounge
   brand needs a **different** brief at different airports, we add an optional per-airport
   override string on `AirportLounge` (small, additive).
3. **Historic data:** confirm we do **not** need to re-price past requests.

---

## 8. Risk & sequencing notes

- The schema + backfill (Stages 1–2) is the highest-risk piece; it ships behind a
  migration with an idempotent, logged backfill and is reversible (old columns retained
  until Stage 6 cleanup).
- Stages 3–5 are additive to the engine/UI and can be verified with unit tests before the
  customer flow is switched over.
- Recommend merging Stages 1–3 first (data + engine, no visible change), then Stages 4–6
  (UI + presentation) in a second PR.
