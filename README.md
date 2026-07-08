# RTD — Premium Luxury Airport Concierge Platform

RTD is a full-stack, bilingual (Arabic RTL / English LTR) luxury airport
concierge and door-to-door transportation platform. Clients build a complete
travel journey — home → airport → assistance → destination → hotel → chauffeur
→ return — with **real-time, chronology-aware validation**, then submit a request
that flows through admin, operations and driver dashboards.

> No fixed prices are ever shown — RTD contacts each client with a tailored offer.

---

## ✨ Highlights

- **SAFAR-style mobile-first customer flow** — dark luxury theme (charcoal/gold/ivory),
  destination picker → step-by-step service cards with Add/Skip → sticky running total →
  priced, editable review → success with reference number.
- **Real pricing engine** (`src/lib/pricing.ts`) — `base × vehicleMultiplier × destinationFactor`,
  chauffeur per-day, lounge-by-type. Admin-editable base prices, multipliers, lounge prices and
  destination factors (`/admin/pricing`). Per-request **override / discount / surcharge** with a
  full price-history audit trail. The server always recomputes authoritatively before saving —
  the client estimate is never trusted.
- **Flight lookup** via a provider abstraction (`FLIGHT_API_PROVIDER=mock|aviationstack|amadeus|flightaware`):
  the client calls a backend action only, responses are normalized to one shape, manual entry is
  always a fallback, and admin sees the lookup status (manual / verified / lookup failed).
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

| Layer        | Choice                                           |
| ------------ | ------------------------------------------------ |
| Framework    | Next.js 15 (App Router) + React 19               |
| Language     | TypeScript (strict)                              |
| Styling      | Tailwind CSS v3 (custom luxury theme)            |
| Database     | PostgreSQL                                       |
| ORM          | Prisma 6                                         |
| Validation   | Zod (server) + a custom bilingual journey engine |
| Forms        | React Hook Form                                  |
| Auth         | `jose` (JWT cookie sessions) + `bcryptjs`        |
| Client state | Zustand (journey draft, persisted as draft only) |
| i18n         | Custom dictionary + context (cookie-persisted)   |

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

| Role       | Email         | Password             | Console           |
| ---------- | ------------- | -------------------- | ----------------- |
| Superadmin | cto@ratbli.sa | _set on first login_ | `/admin/login`    |
| Admin      | admin@rtd.sa  | `Passw0rd!`          | `/admin/login`    |
| Employee   | ops@rtd.sa    | `Passw0rd!`          | `/employee/login` |
| Driver     | driver@rtd.sa | `Passw0rd!`          | `/driver/login`   |

Sample request reference for tracking: **`RTD-2026-00001`** (`/status`).

**Superadmin & admins.** The superadmin (`cto@ratbli.sa`) uses the same
`/admin` dashboard as admins, plus an **Admins** page for creating and
(de)activating admin accounts — a surface regular admins can't see. It ships
with no password. To set one, go to `/admin/set-password`, enter the account
email, and a **one-time setup link** (SHA-256 hashed at rest, ~1h expiry) is
emailed to that address; the link opens the choose-a-password screen and signs
you in. In production the account row is created automatically by the
`seed_superadmin` migration. Running `npm run superadmin:create` also mints a
setup link and prints it directly — handy for bootstrapping before the email
provider (`EMAIL_PROVIDER`) is configured. Requires `NEXT_PUBLIC_APP_URL` for
the absolute link.

### Managing admins

Creating an admin (or any staff account) never sets a password directly — the
new user activates their own via an emailed one-time link:

1. Log in at `/admin/login` as the **superadmin**.
2. In the left nav, click **Admins** (this link only appears for the superadmin).
3. In the **Add new** form, fill in **Full name** (required), **Email**
   (required), and **Phone** (optional).
4. Click **Save** — the account is created _pending activation_.
5. An **activation email** with a one-time setup link is sent to the new admin.
6. They open the link and **set their own password** (min. 10 characters).
7. They're signed in and can use `/admin/login` from then on.

If the activation email can't be delivered, the user can request a fresh link
themselves at `/admin/set-password`. Existing admins can be **activated /
deactivated** from the same page (no one can deactivate their own account, and
only the superadmin can toggle admin-level accounts). The same emailed-activation
flow applies to Employees and Drivers created from their respective pages.

---

## 🔐 Verification & notifications

`SMS_PROVIDER` / `EMAIL_PROVIDER` select the channel implementation:

- **`console`** (default, development): codes are printed to the **server console**,
  and in dev the code is also returned to the verify UI for easy testing.
- **`twilio`** / **`smtp`** (production): wired entirely through environment
  variables (`TWILIO_*`, `SMTP_*`). Swap the provider without touching app code.
  The `smtp` sender is generic (nodemailer) and works with any SMTP provider —
  e.g. **Google Workspace** (`smtp.gmail.com:587` with an App Password from a
  `@ratbli.sa` mailbox), Brevo, Resend, SendGrid or SES. See `.env.example`.

Verification is optional at submission — unverified contacts are clearly marked
**“pending verification”** rather than blocking the request.

**Ops alerts:** when a customer submits a request, the operations team is alerted
via `sendOpsAlert` (same provider abstraction). The email goes to **every active
admin** (ADMIN accounts; superadmins excluded); the superadmin-editable _New-request alert
email_ (`OPS_ALERT_EMAIL`) adds optional extra recipients — e.g. shared ops mailboxes
that aren't staff logins. That field accepts several addresses separated by commas,
semicolons, or whitespace. Each address is emailed independently, so a single bad
address never blocks the rest. Set `OPS_ALERT_PHONE` (with
`OPS_ALERT_SMS_CHANNEL=SMS|WHATSAPP`) to also send an SMS/WhatsApp; if no channel
is reachable, the alert is logged to the server console. The alert is
fire-and-forget — a delivery failure never blocks the submission.

---

## 🚀 Deployment (Railway)

Deployed on **Railway** using its native **Railpack** builder (`npm run build`
→ `next start`) with a managed **PostgreSQL** service. Config is codified in
`railway.json`:

- **`preDeployCommand`: `npx prisma migrate deploy`** — migrations run as a
  release step before each deploy (`prisma` is a runtime dependency so the CLI
  is present). Seed once with a strong `SEED_STAFF_PASSWORD`.
- **`healthcheckPath`: `/api/health`** — returns `200 {"status":"ok"}` when the
  app and database are reachable, `503` otherwise. Railway won't promote a
  deployment until this passes, so a bad build can't replace a healthy one.
- **`startCommand`: `npm run start`**, `restartPolicyType: ON_FAILURE`.

Required env in the deploy target: `DATABASE_URL`, `AUTH_SECRET` (a long random
value), `NEXT_PUBLIC_APP_URL`. See `.env.example` for the full list.

**Environments.** `NEXT_PUBLIC_APP_ENV` (`production` | `preparation` |
`development`) tells the app which deployment it is. Non-production deployments
show a **banner**, are hidden from search engines, and report their name at
`/api/health` — so a **preparation** (staging) environment is visibly and
technically distinct from production. To stand up an isolated preparation
environment that mirrors production and has its own URL, follow the step-by-step
guide in [`docs/RAILWAY_PREPARATION_ENVIRONMENT.md`](docs/RAILWAY_PREPARATION_ENVIRONMENT.md).

> Note: no Dockerfile is used — Railway auto-detects a Dockerfile and would
> override Railpack, so the app is deployed via Railpack to match the working
> setup. A container image can be reintroduced if moving to a container platform.

## 🗄️ Useful scripts

```bash
npm run dev            # dev server
npm run build          # prisma generate + next build
npm run start          # production server
npm run typecheck      # tsc --noEmit
npm test               # vitest — unit tests for the pricing & validation engines
npm run test:watch     # vitest in watch mode
npm run db:seed        # seed
npm run db:reset       # reset + re-migrate (destructive)
npm run prisma:studio  # browse the DB
```

## 🧪 Tests & CI

Unit tests (Vitest) cover the two pure engines that must never silently
regress — the **pricing engine** (`src/lib/pricing.test.ts`) and the bilingual
**journey validation engine** (`src/lib/validation/journey.test.ts`) — plus the
**rate limiter** (`src/lib/rate-limit.test.ts`). Run them with `npm test`.

GitHub Actions (`.github/workflows/ci.yml`) runs `prisma generate`, **lint**
(`next lint --max-warnings=0`), `typecheck` and the test suite on every push and
pull request. ESLint (`eslint-config-next`) and Prettier configs are committed;
`npm run format` applies Prettier locally (not yet a CI gate).

**Rate limiting:** staff login and verification-code issuance are throttled
(`src/lib/rate-limit.ts`) to blunt brute-force and SMS-cost abuse. State is
in-memory (per instance); swap the store for Redis in a multi-instance deploy.

## 🔭 Observability

Structured logging via `src/lib/logger.ts` — JSON lines in production, readable
in dev, level-filtered by `LOG_LEVEL`. Unhandled server errors are captured by
`src/instrumentation.ts` (`onRequestError`) and client render errors by the root
`app/global-error.tsx` boundary. Both route through `logger.error`, which
forwards to a pluggable reporter (`setErrorReporter`) — the single seam to wire
an error-tracking SDK (e.g. Sentry: `setErrorReporter((err, ctx) =>
Sentry.captureException(err, { extra: ctx }))` in `register()`).

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

```
