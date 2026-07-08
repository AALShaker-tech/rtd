# Setting up a Preparation environment on Railway

This guide walks you, step by step, through creating a **preparation**
environment on Railway that:

- **matches** your current production version,
- is **fully isolated** — nothing you do in preparation can affect production,
- and is reachable at its **own separate URL**, so you can view your changes
  before they ever go live.

It is written for someone doing this for the first time. Follow it top to
bottom. Anything you do in the Railway dashboard is safe as long as you stay in
the **preparation** environment — production is never touched by these steps.

---

## The idea in one picture

A Railway **project** can contain several **environments**. Each environment is
a complete, separate copy of your app and its database:

```
Railway project: RTD
│
├── production   (environment)   ← the live site your customers use
│     ├── app service   → https://<your-production-domain>
│     └── PostgreSQL     → production database  (real customer data)
│
└── preparation  (environment)   ← the safe copy you will create
      ├── app service   → https://<your-preparation-domain>   (separate URL)
      └── PostgreSQL     → preparation database  (its own data, a copy)
```

The two environments **share nothing at runtime**. Different app, different
database, different URL, different variables. That separation is exactly what
keeps production safe while you experiment.

> **The single most important rule:** the preparation environment must have its
> **own database**. If preparation ever points at the production database, your
> test changes and migrations will hit real customer data. Everything below is
> designed so that never happens — but it is the one thing to double-check.

---

## Before you start

You'll need:

- Access to the Railway project that already runs production (log in at
  [railway.com](https://railway.com)).
- About 20–30 minutes.
- The list of environment variables production uses. You can see them in
  Railway (production environment → your app service → **Variables**), and the
  full catalogue is documented in [`.env.example`](../.env.example).

You do **not** need to install anything on your computer for this. It is all
done in the Railway dashboard and this GitHub repository.

---

## Part A — Prepare the code (already done for you)

The repository now understands "which environment am I?" through one variable,
`NEXT_PUBLIC_APP_ENV`. You will set it to `preparation` on the preparation
environment and `production` on production (details in Part C). Because of this:

- The preparation site shows a small **"PREPARATION environment — not the live
  site"** banner across the top, so you can never confuse it with production.
- The preparation site is **hidden from Google** and other search engines, so
  customers never stumble onto it.
- The health check at `/api/health` reports which environment answered, so you
  can verify a deploy from outside (see Part F).

You don't have to do anything for this part — it ships in the code. It only
kicks in once you set the variable in Part C.

---

## Part B — Create the preparation environment

You said you already have a preparation environment. **Skip to Part C if so** —
but first confirm it has its _own_ database (Part C, step 2, tells you how). If
you do not have one yet, create it here.

1. Open your project in Railway.
2. At the top of the project canvas there is an **environment switcher** (it
   currently says **production**). Click it.
3. Click **＋ New Environment** (or **Create Environment**).
4. Choose **Duplicate / Fork** the **production** environment — _not_ an empty
   one. Forking copies production's services and variable names, which is what
   "match production" means. Name it **`preparation`**.
5. Confirm. Railway builds a new environment that mirrors production's setup.

You are now looking at the **preparation** environment. Check the environment
switcher at the top — it should say **preparation**. Everything you do from here
stays in preparation.

---

## Part C — Give preparation its own database and variables

This is the part that guarantees isolation. Do it carefully.

### 1. Make sure the environment switcher says `preparation`

Look at the top of the screen. If it says `production`, click it and switch to
`preparation`. **Do not do the following steps while in production.**

### 2. Confirm preparation has its OWN database

- In the preparation environment, click the **PostgreSQL** service.
- Open its **Variables** / **Connect** tab and look at the connection details.
- A forked environment normally gets a **brand-new, empty PostgreSQL** of its
  own. Good — that is what you want.
- **Verify** the app's `DATABASE_URL` points at _this_ preparation database and
  not production. The safest way: on the app service, set `DATABASE_URL` using a
  **reference** to the preparation Postgres service rather than a pasted string:

  1. Preparation env → **app service** → **Variables** → find `DATABASE_URL`.
  2. Set its value by referencing the database service, e.g.
     `${{ Postgres.DATABASE_URL }}` (Railway offers this as an autocomplete when
     you start typing `${{`). This always resolves to _the current
     environment's_ Postgres, so it can never accidentally point at production.

> ⚠️ If you ever see the **same** database host in both production and
> preparation, stop — they are sharing a database. Fix it before deploying by
> adding a dedicated PostgreSQL service to the preparation environment and
> pointing `DATABASE_URL` at it as above.

### 3. Set the preparation variables

Still in the **preparation** environment, on the **app service → Variables**,
set the values below. Most can stay the same as production; a few **must**
change so preparation stays safe and self-contained.

| Variable                                                                       | In preparation set it to…                                                        | Why                                                                    |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_ENV`                                                          | `preparation`                                                                    | Turns on the banner + search-engine blocking. **Add this — it's new.** |
| `DATABASE_URL`                                                                 | reference to the **preparation** Postgres (step 2)                               | Isolation — its own database.                                          |
| `NEXT_PUBLIC_APP_URL`                                                          | the preparation URL (from Part D, e.g. `https://rtd-preparation.up.railway.app`) | Links/emails point at the right site.                                  |
| `AUTH_SECRET`                                                                  | a **new** long random value (`openssl rand -base64 48`)                          | Sessions stay separate from production.                                |
| `SMS_PROVIDER`                                                                 | `console`                                                                        | So test bookings never send real SMS to real people.                   |
| `EMAIL_PROVIDER`                                                               | `console`                                                                        | So test bookings never send real emails.                               |
| `OPS_ALERT_EMAIL` / `OPS_ALERT_PHONE`                                          | leave **blank** (or a test address)                                              | So your ops team isn't paged by test data.                             |
| `SEED_STAFF_PASSWORD`                                                          | a strong value you'll use to log into preparation                                | Needed to seed staff accounts (Part E).                                |
| Everything else (`NEXT_PUBLIC_WHATSAPP_NUMBER`, flight/pricing settings, etc.) | same as production                                                               | To faithfully match production behaviour.                              |

On the **production** environment, add one variable too: set
`NEXT_PUBLIC_APP_ENV` to `production` (or leave it unset — production is the
default, so the banner will not show either way). Switch the environment
switcher to `production`, add it, switch back to `preparation`. That is the only
change production needs, and it changes nothing visible on the live site.

---

## Part D — Give preparation its own URL

1. In the **preparation** environment, click the **app service**.
2. Open **Settings → Networking** (sometimes **Domains**).
3. Click **Generate Domain**. Railway creates a free `*.up.railway.app` URL that
   belongs only to preparation — e.g. `https://rtd-preparation.up.railway.app`.
4. Copy that URL and paste it into the `NEXT_PUBLIC_APP_URL` variable from Part
   C, step 3.

This is your **separate preparation location**. Production keeps its own domain,
untouched. (If you later want a nicer name like `staging.ratbli.sa`, you can add
a custom domain here too — optional.)

---

## Part E — First deploy and seed

1. Make sure you're on the **preparation** environment.
2. Preparation deploys from a Git branch, the same way production does. On the
   app service → **Settings → Source**, check which branch preparation tracks.
   A common setup:
   - **production** deploys from `main`,
   - **preparation** deploys from a branch like
     `claude/railway-prep-environment-2txvy7` (this branch) or a long-lived
     `staging` branch.

   Set preparation to deploy from whichever branch holds the changes you want to
   preview. See "Day-to-day workflow" below for the recommended flow.

3. Trigger a deploy (push to that branch, or click **Deploy**). Railway runs the
   same steps as production, defined in [`railway.json`](../railway.json):
   - `npx prisma migrate deploy` applies the database schema to the **empty
     preparation database**,
   - the app builds and starts,
   - the `/api/health` check must pass before the deploy goes live.
4. **Seed staff accounts** so you can log in. The preparation database starts
   empty. From the app service, open a one-off **shell/command** (Railway:
   service → the "⋯" menu → **Run a command**, or use the Railway CLI) and run:

   ```bash
   npm run db:seed
   ```

   This uses `SEED_STAFF_PASSWORD` you set in Part C. If you'd rather create just
   a superadmin, use `npm run superadmin:create` instead.

---

## Part F — Verify it worked

1. Open your preparation URL. You should see the site with the amber
   **"PREPARATION environment — not the live site"** banner across the top. If
   you see the banner, `NEXT_PUBLIC_APP_ENV=preparation` is working.
2. Visit `https://<your-preparation-url>/api/health`. You should get:

   ```json
   { "status": "ok", "db": "up", "env": "preparation", "commit": "…" }
   ```

   `"env": "preparation"` confirms you're talking to the preparation instance,
   and `"db": "up"` confirms it reached its own database.

3. Open your **production** URL and confirm it has **no banner** and
   `/api/health` reports `"env": "production"`. Two different sites, two
   different databases. Done.

---

## Day-to-day workflow (how you'll actually use this)

The goal: build and view changes in preparation first, and only move them to
production once you're happy.

1. **Make changes on a branch** (not directly on `main`). This repository's
   changes for you live on `claude/railway-prep-environment-2txvy7`.
2. **Point preparation at that branch** (Part E, step 2). Every push
   auto-deploys to the preparation URL, where you can click through and review.
3. **When you're satisfied**, merge the branch into `main` via a pull request.
   Production deploys from `main`, so merging is what promotes the change to the
   live site.
4. Production and preparation never share a database, so testing in preparation —
   even destructive tests, resets, or bad data — cannot harm real customers.

```
 you push  ─▶  preparation branch  ─▶  auto-deploys  ─▶  preparation URL  (review here)
                        │
                  merge to main
                        │
                        ▼
                  production  ─▶  auto-deploys  ─▶  production URL  (live)
```

---

## Keeping preparation matched to production

Over time production changes (new merges to `main`). To keep preparation a
faithful copy:

- **Code:** periodically update your preparation branch from `main`
  (`git merge origin/main` or rebase), or point preparation directly at `main`
  when you just want to preview exactly what's live.
- **Variables:** if you add or change a variable in production, mirror it in
  preparation (remember to keep the preparation-specific overrides from Part C —
  its own `DATABASE_URL`, `console` providers, blank ops alerts).
- **Database schema:** it stays matched automatically — `prisma migrate deploy`
  runs on every deploy in both environments, so both databases share the same
  schema. Only the _data_ differs (preparation has test data, production has
  real data), which is exactly what you want.

---

## Safety checklist

Before you consider preparation "ready", confirm:

- [ ] The environment switcher shows **preparation** while you configure it.
- [ ] Preparation has its **own PostgreSQL** service, and `DATABASE_URL`
      references it (not production's).
- [ ] `NEXT_PUBLIC_APP_ENV = preparation` on preparation → banner shows,
      `/api/health` reports `"env":"preparation"`.
- [ ] `SMS_PROVIDER = console` and `EMAIL_PROVIDER = console` on preparation, so
      test bookings send **no** real messages.
- [ ] `OPS_ALERT_EMAIL` / `OPS_ALERT_PHONE` are blank (or test values) on
      preparation.
- [ ] Preparation has its **own generated domain** (separate URL).
- [ ] Production still shows **no** banner and `/api/health` reports
      `"env":"production"`.

If every box is checked, you have a preparation environment that matches
production, is fully isolated, and is viewable at its own URL — safe to
experiment in.

---

## Troubleshooting

- **No banner on preparation** → `NEXT_PUBLIC_APP_ENV` isn't set to
  `preparation`, _or_ the app wasn't redeployed after setting it. Set the
  variable and redeploy. (It's a `NEXT_PUBLIC_` variable, so it's baked in at
  **build** time — you must redeploy, not just restart.)
- **Deploy fails on the health check** → usually the database. Check
  `DATABASE_URL` references the preparation Postgres and that
  `prisma migrate deploy` ran (see the deploy logs).
- **Can't log in to preparation** → the database is empty until you seed it. Run
  `npm run db:seed` (Part E, step 4) and log in with `SEED_STAFF_PASSWORD`.
- **Preparation shows production data** → the environments are sharing a
  database. Stop using preparation until you give it a dedicated PostgreSQL and
  repoint `DATABASE_URL` (Part C, step 2). This is the one setup that is unsafe.

---

For the general deployment model (Railpack builder, `railway.json`, the health
check), see the **Deployment (Railway)** section of the [README](../README.md).
