"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { CITIES, STEPS, VEHICLES } from "@/lib/domain";

export default function HomePage() {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const Fwd = ar ? "←" : "→";

  return (
    <div className="ink-wrap pb-16">
      {/* Hero */}
      <section className="rise pt-7">
        <span className="inline-flex items-center gap-1.5 rounded-full border gold-line px-3 py-1.5 text-[13px] text-gold">
          <Crown /> {pick(t.home.eyebrow)}
        </span>
        <h1 className="disp mt-4 text-[34px] font-bold leading-[1.25] text-cream sm:text-[40px]">
          {pick(t.home.heroTitle)}
        </h1>
        <p className="mt-3 max-w-md text-[15.5px] leading-[1.8] text-dim">{pick(t.home.heroSubtitle)}</p>
        <Link href="/journey" className="gbtn mt-6">
          {pick(t.home.ctaBuild)} <span>{Fwd}</span>
        </Link>
        <p className="mt-3 text-[12.5px] text-gold/70">{pick(t.home.quoteNote)}</p>
      </section>

      {/* Destinations */}
      <section className="dcard mt-8 p-[18px]">
        <div className="mb-3 flex items-center gap-1.5 text-[12.5px] text-dim">
          <Pin /> {pick(t.home.citiesTitle)}
        </div>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter((c) => c.code !== "RUH").map((d) => (
            <span
              key={d.code}
              className="inline-flex items-center gap-1.5 rounded-full border gold-line px-3 py-2"
              style={{ background: "rgba(201,168,106,.08)" }}
            >
              <span className="disp text-[15px] font-semibold text-cream">{pick(d.name)}</span>
              <span className="text-[11px] tracking-widest text-dim">{d.airports[0].code}</span>
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-9">
        <h2 className="disp text-2xl font-semibold text-cream">{pick(t.home.servicesTitle)}</h2>
        <p className="mb-4 mt-1 text-sm text-dim">{pick(t.home.servicesSubtitle)}</p>
        <div className="relative">
          <span
            className="absolute top-2 bottom-2 w-0.5"
            style={{ background: "rgba(201,168,106,.22)", insetInlineStart: 21 }}
          />
          {STEPS.map((s, i) => (
            <div key={s.type} className="relative flex gap-3.5 pb-4">
              <div className="z-[1] grid h-11 w-11 flex-shrink-0 place-items-center rounded-[13px] border gold-line bg-ink-800 text-gold">
                <StepIcon n={i} />
              </div>
              <div className="pt-0.5">
                <div className="flex items-center gap-1 text-[11.5px] text-dim">
                  <Pin /> {pick(s.cityScope === "RIYADH" ? { en: "Riyadh", ar: "الرياض" } : { en: "Destination", ar: "الوجهة" })}
                </div>
                <div className="mt-0.5 text-[15.5px] font-medium text-cream">{pick(s.name)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fleet */}
      <section className="mt-6">
        <h2 className="disp text-2xl font-semibold text-cream">{pick(t.home.fleetTitle)}</h2>
        <div className="mt-4 grid gap-3">
          {VEHICLES.map((v) => (
            <div
              key={v.category}
              className={`dcard-soft p-4 ${v.isRecommended ? "dcard-selected" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="disp text-[17px] font-semibold text-cream">{pick(v.name)}</span>
                  <span className="ms-2 text-[12px] text-dim">
                    {ar ? `حتى ${v.maxPassengers}` : `up to ${v.maxPassengers}`} {pick(t.fields.passengers).toLowerCase?.() ?? ""}
                  </span>
                  <div className="mt-0.5 text-[12.5px] text-dim">{v.exampleModels}</div>
                </div>
                {v.isRecommended && (
                  <span className="rounded-full px-2.5 py-1 text-[11px] text-gold" style={{ background: "rgba(201,168,106,.14)" }}>
                    {ar ? "موصى به" : "Recommended"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link href="/journey" className="gbtn mt-8 w-full">
        {pick(t.home.ctaBuild)} <span>{Fwd}</span>
      </Link>
    </div>
  );
}

function Crown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7l4 5 5-7 5 7 4-5v11H3z" strokeLinejoin="round" />
    </svg>
  );
}
function Pin() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function StepIcon({ n }: { n: number }) {
  return <span className="text-[15px] font-semibold">{String(n + 1).padStart(2, "0")}</span>;
}
