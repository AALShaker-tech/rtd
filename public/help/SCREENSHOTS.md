# Help Center screenshots — capture checklist

The in-app Help Center (`/admin/help`, `/employee/help`, `/driver/help`) shows
screenshots via the `<HelpImage>` component. Until a real image file exists,
`<HelpImage>` renders a labelled **"Screenshot coming soon"** placeholder — so
the guide never ships fabricated or broken visuals. Drop the captured files in
and they appear automatically; no code change is needed.

## Where files go

Screenshots are **per-locale**, because RTL (Arabic) mirrors the whole layout:

```
public/help/en/<filename>   ← English (LTR) capture
public/help/ar/<filename>   ← Arabic  (RTL) capture
```

`<HelpImage>` loads `/help/{locale}/{filename}` for the reader's current
language. Capture each screen **twice** — once with the app in English, once in
Arabic (use the language switcher in the top bar). If you only have one locale
for now, add it; the other locale will keep showing the placeholder until
captured.

## Guidelines

- Sign in with a real staff account and use a **demo/test request** — never a
  real customer's personal data (blur names, phone numbers, and emails if any
  real data is visible).
- Capture at a **desktop width** (the dashboard sidebar visible) unless noted.
- Export as **PNG**, keep the filename exactly as listed below.
- Keep the two locales visually equivalent (same request, same screen state).

## Screenshots the guide expects

| # | Filename | Article (slug) | Screen to capture | What it should show | Locales |
|---|----------|----------------|-------------------|---------------------|---------|
| 1 | `request-detail-actions.png` | Managing a request (`managing-a-request`) | Admin → Requests → open a request → the right-hand action panel | The action panel: Pricing (estimated vs final, payment status, override/discount/surcharge), Change status with Mark confirmed / Mark completed, Assign employee, Assign driver, Internal notes | `en`, `ar` |
| 2 | `add-city.png` | Cities & destinations (`cities-destinations`) | Admin → Cities → select or add a city | The city details form with airports and the per-city trip/lounge price fields, and the landmark icon picker (Auto + presets) | `en`, `ar` |

_When you add a new `{ kind: "image", file: "…" }` block in
`src/content/help/articles.ts`, add a matching row here so the capture list
stays in sync._
