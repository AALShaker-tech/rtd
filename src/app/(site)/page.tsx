"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { CITIES, STEPS } from "@/lib/domain";
import { useVehicles } from "@/components/vehicles/VehicleProvider";
import { vehicleName, vehicleDescription } from "@/lib/vehicles";

export default function HomePage() {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const { vehicles } = useVehicles();

  return (
    <>
      {/* ───────── Hero (elegant dark band) ───────── */}
      <section className="relative overflow-hidden lux-dark">
        <div className="absolute inset-0 bg-hero-glow" aria-hidden />
        <div className="luxe-container relative grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-gold-light">
              {pick(t.home.eyebrow)}
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] text-ivory sm:text-5xl md:text-6xl">
              {pick(t.home.heroTitle)}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">{pick(t.home.heroSubtitle)}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/journey" className="btn-gold">{pick(t.home.ctaBuild)} <Arrow /></Link>
              <Link href="/packages" className="btn-outline border-ivory/25 text-ivory hover:border-gold hover:text-gold-light">
                {pick(t.home.ctaPackages)}
              </Link>
            </div>
            <p className="mt-6 text-xs text-gold-light/70">{pick(t.home.quoteNote)}</p>
          </div>

          {/* Floating journey preview */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="ms-auto max-w-sm rounded-luxe border border-gold/20 bg-white/5 p-6 backdrop-blur-md">
              <div className="gold-rule mb-4" />
              <p className="mb-4 font-serif text-lg text-gold-light">{ar ? "رحلتك في لمحة" : "Your journey at a glance"}</p>
              <ul className="space-y-4">
                {STEPS.slice(0, 4).map((s, i) => (
                  <li key={s.type} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-[0.7rem] font-bold text-charcoal">{i + 1}</span>
                    <span className="text-sm text-ivory/80">{pick(s.shortName)}</span>
                  </li>
                ))}
                <li className="ps-9 text-xs text-ivory/40">{ar ? "و٥ خدمات أخرى…" : "+ 5 more services…"}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Intro ───────── */}
      <section className="luxe-container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="gold-rule mx-auto mb-6" />
          <p className="text-xl leading-relaxed text-charcoal/80 md:text-2xl">{pick(t.home.intro)}</p>
        </div>
      </section>

      {/* ───────── Services ───────── */}
      <section className="bg-ivory-warm py-16 md:py-24">
        <div className="luxe-container">
          <SectionTitle eyebrow={pick(t.home.servicesSubtitle)} title={pick(t.home.servicesTitle)} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.type} className="luxe-card luxe-card-hover group p-6">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-sm font-semibold text-gold-light transition group-hover:bg-gold-gradient group-hover:text-charcoal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-charcoal">{pick(s.name)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{pick(s.description)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Fleet ───────── */}
      <section className="luxe-container py-16 md:py-24">
        <SectionTitle eyebrow={pick(t.packages.requestQuote)} title={pick(t.home.fleetTitle)} />
        <div className="grid gap-6 md:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.category} className={`luxe-card relative overflow-hidden p-7 ${v.isRecommended ? "ring-2 ring-gold" : ""}`}>
              {v.isRecommended && (
                <span className="badge absolute end-4 top-4 bg-gold-gradient text-charcoal">{ar ? "موصى به" : "Recommended"}</span>
              )}
              <h3 className="gold-text text-2xl font-semibold">{vehicleName(v, locale)}</h3>
              <p className="mt-1 text-sm font-medium text-charcoal/70">{v.exampleModels}</p>
              <p className="mt-4 text-sm leading-relaxed text-charcoal/60">{vehicleDescription(v, locale)}</p>
              <p className="mt-5 text-sm text-charcoal/50">{ar ? `حتى ${v.maxPassengers} ركاب` : `Up to ${v.maxPassengers} passengers`}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-charcoal/50">{pick(t.home.quoteNote)}</p>
      </section>

      {/* ───────── Cities (dark band) ───────── */}
      <section className="lux-dark py-16 md:py-24">
        <div className="luxe-container">
          <SectionTitle light eyebrow={pick(t.brand.tagline)} title={pick(t.home.citiesTitle)} />
          <div className="flex flex-wrap justify-center gap-4">
            {CITIES.map((c) => (
              <div key={c.code} className="rounded-luxe border border-gold/20 bg-white/5 px-7 py-5 text-center backdrop-blur-sm">
                <p className="font-serif text-xl text-gold-light">{pick(c.name)}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-ivory/40">{c.airports[0].code}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="luxe-container py-20 text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold text-charcoal md:text-4xl">
          {ar ? "جاهز لتصميم رحلتك؟" : "Ready to craft your journey?"}
        </h2>
        <div className="mt-8 flex justify-center">
          <Link href="/journey" className="btn-gold">{pick(t.home.ctaBuild)} <Arrow /></Link>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ eyebrow, title, light }: { eyebrow: string; title: string; light?: boolean }) {
  return (
    <div className="mb-12 text-center">
      <p className={`mb-3 text-xs font-medium uppercase tracking-[0.3em] ${light ? "text-gold-light" : "text-gold-dark"}`}>{eyebrow}</p>
      <h2 className={`text-3xl font-semibold md:text-4xl ${light ? "text-ivory" : "text-charcoal"}`}>{title}</h2>
      <div className="gold-rule mx-auto mt-5" />
    </div>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rtl:rotate-180">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
