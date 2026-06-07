# RTD — Premium Luxury Airport Concierge Platform

RTD is a full-stack, bilingual (Arabic RTL / English LTR) luxury airport
concierge and door-to-door transportation platform. Clients build a complete
travel journey — home → airport → assistance → destination → hotel → chauffeur
→ return — with **real-time, chronology-aware validation**, then submit a request
that flows through admin, operations and driver dashboards.

> No fixed prices are ever shown — RTD contacts each client with a tailored offer.

---

## ✨ Highlights

- **Journey builder** with 9 composable services, ready-made packages, skip/edit/reorder.
- **Real-time validation engine** — field, step, and cross-step **timeline** checks
  (e.g. "this transfer is before your flight arrival"), all bilingual. Critical
  errors block confirmation; soft warnings don't.
- **Phone & email verification** via a provider abstraction (console in dev, Twilio/SMTP in prod).
- **WhatsApp integration** — pre-filled `wa.me/966550832444` deep links with the full journey summary.
- **Role-based dashboards**: Admin (full control), Operations Employee (own requests only),
  Driver (own tasks only) — with real auth, hashed passwords, JWT sessions, and middleware guards.
- **Audit log & status history** for every meaningful change.
- **Luxury design system**: deep charcoal base, soft gold accents, ivory surfaces,
  custom cards, animated journey timeline, premium typography. RTL/LTR throughout.

---

## 🧱 Tech stack

| Layer        | Choice                                            |
|--------------|---------------------------------------------------|
| Framework    | Next.js 15 (App Router) + React 19                |
| Language     | TypeScript (strict)                               |
| Styling      | Tailwind CSS v3 (custom luxury theme)             |
| Database     | PostgreSQL                                         |
| ORM          | Prisma 6                                           |
| Validation   | Zod (server) + a custom bilingual journey engine  |
| Forms        | React Hook Form                                    |
| Auth         | `jose` (JWT cookie sessions) + `bcryptjs`         |
| Client state | Zustand (journey draft, persisted as draft only)  |
| i18n         | Custom dictionary + context (cookie-persisted)    |

---

## 📁 Project structure

```
prisma/
  schema.prisma            # Full data model (15 models)
  seed.ts                  # Reference data + demo staff + sample request
src/
  app/
    (site)/                # Public customer site (header/footer layout)
      page.tsx             # Homepage (hero, services, fleet, cities)
      packages/            # Ready-made packages
      journey/             # Builder → details → verify → review wizard
      success/[reference]/ # Confirmation + WhatsApp deep link
      status/              # Public request tracking
    admin/                 # Admin console (login + protected (dash) group)
    employee/              # Operations console (own requests only)
    driver/                # Driver app (own tasks only)
  components/
    ui/                    # Reusable primitives (Field, Logo, StatusBadge…)
    journey/               # Builder pieces (StepForm, JourneySummary, ValidationList…)
    dashboard/             # Shell, RequestJourney, StaffManager
    auth/                  # LoginForm
  i18n/                    # Dictionary + I18nProvider
  lib/
    domain.ts              # Single source of truth (cities, vehicles, steps, packages…)
    validation/            # Zod schemas + the bilingual journey validation engine
    phone.ts               # International + Saudi phone validation
    whatsapp.ts            # wa.me message + link builder
    auth.ts                # Sessions, hashing
  server/
    services/              # request, verification, notify (SMS/WhatsApp/email), audit
    actions/               # Server actions (thin boundary the client calls)
  store/                   # Zustand journey draft
  middleware.ts            # Role-based route protection
```

**Separation of concerns:** UI (`components`, `app`) → server actions
(`server/actions`) → services (`server/services`) → database (`lib/prisma` + Prisma).
Domain config and validation are pure, shared between client and server.

---

## 🚀 Getting started

### 1. Prerequisites
- Node.js 20+ and a running **PostgreSQL** instance.

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set at least `DATABASE_URL` and `AUTH_SECRET`
(generate one with `openssl rand -base64 48`). No secrets are hardcoded.

### 4. Database — migrate & seed
```bash
npx prisma migrate dev      # create the schema
npm run db:seed             # reference data + demo accounts + sample request
```

### 5. Run
```bash
npm run dev                 # http://localhost:3000
```

### Demo staff accounts (from the seed)
| Role     | Email           | Password    | Console          |
|----------|-----------------|-------------|------------------|
| Admin    | admin@rtd.sa    | `Passw0rd!` | `/admin/login`   |
| Employee | ops@rtd.sa      | `Passw0rd!` | `/employee/login`|
| Driver   | driver@rtd.sa   | `Passw0rd!` | `/driver/login`  |

Sample request reference for tracking: **`RTD-2026-00001`** (`/status`).

---

## 🔐 Verification & notifications

`SMS_PROVIDER` / `EMAIL_PROVIDER` select the channel implementation:

- **`console`** (default, development): codes are printed to the **server console**,
  and in dev the code is also returned to the verify UI for easy testing.
- **`twilio`** / **`smtp`** (production): wired entirely through environment
  variables (`TWILIO_*`, `SMTP_*`). Swap the provider without touching app code.

Verification is optional at submission — unverified contacts are clearly marked
**“pending verification”** rather than blocking the request.

---

## 🗄️ Useful scripts

```bash
npm run dev            # dev server
npm run build          # prisma generate + next build
npm run start          # production server
npm run typecheck      # tsc --noEmit
npm run db:seed        # seed
npm run db:reset       # reset + re-migrate (destructive)
npm run prisma:studio  # browse the DB
```

---

## ✅ Acceptance criteria coverage

1. ✅ Full journey builder (9 services + packages)
2. ✅ Real-time validation (field / step / timeline)
3. ✅ Confirmation blocked on critical timeline errors
4. ✅ Review & edit everything before submit
5. ✅ Reference number `RTD-YYYY-NNNNN`
6. ✅ WhatsApp via `wa.me/966550832444`
7. ✅ Admin manages submitted requests
8. ✅ Admin assigns employee & driver
9. ✅ Employee sees only assigned requests (enforced server-side)
10. ✅ Driver sees only assigned tasks (enforced server-side)
11. ✅ Arabic RTL & English LTR everywhere
12. ✅ No fixed prices
13. ✅ Distinctive luxury design
14. ✅ Real full-stack architecture (not a demo MVP)

---

## 📌 Assumptions & notes

- **Customers are not user accounts.** They submit requests and track them by
  reference number; only staff (admin/employee/driver) authenticate. This matches
  a concierge model where the team drives fulfilment.
- **Journey drafts** are persisted to `localStorage` purely so a client can resume
  an unfinished journey. PostgreSQL is the system of record on submission.
- **PDF export** uses the browser's print-to-PDF (a print-optimised request view),
  avoiding a heavy server-side PDF dependency while remaining fully functional.
- **Driver tasks** are auto-generated for transport-type steps (home/airport/hotel
  transfers + chauffeur) when a car service is selected.
- The validation engine runs on **both** client (instant feedback) and server
  (authoritative re-check) — the client is never trusted.
- Hotel selection supports search-or-type free entry; a `Hotel` table exists for
  optional curated suggestions.
```
