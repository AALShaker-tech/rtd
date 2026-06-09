"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { CITIES, getCity, getStep } from "@/lib/domain";
import { ALL_STEPS, useJourneyStore } from "@/store/journeyStore";
import { usePricing } from "@/components/pricing/PricingProvider";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { validateStep } from "@/lib/validation/journey";
import { StepCard } from "@/components/journey/StepCard";
import { JourneySummary } from "@/components/journey/JourneySummary";

export default function JourneyPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";

  const destination = useJourneyStore((s) => s.destination);
  const steps = useJourneyStore((s) => s.steps);
  const initFlow = useJourneyStore((s) => s.initFlow);
  const updateStep = useJourneyStore((s) => s.updateStep);
  const { config } = usePricing();

  const [stage, setStage] = useState<"destination" | "flow">(destination ? "flow" : "destination");
  const [idx, setIdx] = useState(0);

  function pickDestination(code: string) {
    initFlow(code);
    setIdx(0);
    setStage("flow");
  }
  function advance() {
    if (idx < ALL_STEPS.length - 1) setIdx(idx + 1);
    else router.push("/journey/details");
  }
  function back() {
    if (idx > 0) setIdx(idx - 1);
    else setStage("destination");
  }

  // ─────────── Destination picker ───────────
  if (stage === "destination") {
    return (
      <div className="luxe-container max-w-4xl py-12 md:py-16">
        <div className="mb-10 text-center">
          <div className="gold-rule mx-auto mb-5" />
          <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.builder.chooseDestination)}</h1>
          <p className="mx-auto mt-3 max-w-md text-charcoal/60">{pick(t.builder.chooseDestinationSub)}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CITIES.filter((c) => c.code !== "RUH").map((d) => (
            <button key={d.code} onClick={() => pickDestination(d.code)} className="sel-card flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-charcoal text-gold-light">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" /></svg>
                </span>
                <div>
                  <div className="font-serif text-lg font-semibold text-charcoal">{pick(d.name)}</div>
                  <div className="text-xs text-charcoal/50">{d.airports[0].code} · {pick(d.airports[0].name)}</div>
                </div>
              </div>
              <span className="text-gold-dark rtl:rotate-180">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────── Step-by-step flow ───────────
  const def = ALL_STEPS[idx];
  const step = steps.find((s) => s.stepType === def.type);
  const progress = Math.round((idx / ALL_STEPS.length) * 100);
  if (!step) return null;

  // Show the price the step *would* add (it starts un-added / skipped).
  const subtotal = computeStepPrice({ ...step, skipped: false }, config).computedPrice;
  const stepValidation = validateStep({ ...step, skipped: false });
  const blockAdd = stepValidation.errors.some((e) => e.field === "passengers"); // capacity downgrade etc.

  return (
    <div className="luxe-container max-w-6xl py-8 md:py-12">
      {/* Route bar */}
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-charcoal/10 bg-white px-4 py-3 shadow-sm">
        <span className="flex items-center gap-2 text-sm font-medium text-charcoal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8854a" strokeWidth="2"><path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" /></svg>
          {ar ? "الرياض" : "Riyadh"} ✈ {destination ? getCity(destination)?.name[locale] : ""} ✈ {ar ? "الرياض" : "Riyadh"}
        </span>
        <button onClick={() => setStage("destination")} className="text-sm font-medium text-gold-dark hover:underline">{pick(t.builder.change)}</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main */}
        <div>
          {/* Back + progress */}
          <div className="mb-4 flex items-center gap-3">
            <button onClick={back} className="btn-outline px-4 py-2 text-xs">{ar ? "→" : "←"} {pick(t.common.back)}</button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal/10">
              <div className="h-full rounded-full bg-gold-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-charcoal/50">{pick(t.common.step)} {idx + 1} {pick(t.common.of)} {ALL_STEPS.length}</span>
          </div>

          {/* Step card */}
          <div key={def.type} className="luxe-card animate-fade-up p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-gradient text-base font-bold text-charcoal">{def.order}</span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gold-dark">
                  {pick(def.cityScope === "RIYADH" ? { en: "Riyadh", ar: "الرياض" } : { en: "Destination", ar: "الوجهة" })}
                </p>
                <h2 className="mt-0.5 font-serif text-2xl font-semibold text-charcoal">{pick(def.name)}</h2>
                <p className="mt-1 text-sm leading-relaxed text-charcoal/60">{pick(def.description)}</p>
              </div>
            </div>

            <div className="mt-6">
              <StepCard step={step} onChange={(patch) => updateStep(def.type, patch)} />
            </div>

            {/* Subtotal + Add/Skip */}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-ivory-warm px-4 py-3">
              <span className="text-sm text-charcoal/60">{pick(t.builder.estimatedPrice)}</span>
              <span className="font-serif text-lg font-semibold text-gold-dark">{formatPrice(subtotal, locale)}</span>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => { if (blockAdd) return; updateStep(def.type, { skipped: false }); advance(); }} disabled={blockAdd} className="btn-gold flex-1">
                ✓ {pick(t.builder.addService)}
              </button>
              <button onClick={() => { updateStep(def.type, { skipped: true }); advance(); }} className="btn-outline">{pick(t.common.skip)}</button>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <JourneySummary />
        </div>
      </div>

      {/* Mobile sticky running total */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-charcoal/10 bg-white/90 backdrop-blur-xl lg:hidden">
        <div className="luxe-container flex items-center justify-between py-3">
          <span className="text-sm text-charcoal/60">{pick(t.builder.totalSoFar)}</span>
          <span className="font-serif text-lg font-semibold text-gold-dark">
            {formatPrice(
              steps.filter((s) => !s.skipped && s.serviceType !== "SKIP").reduce((sum, s) => sum + computeStepPrice(s, config).computedPrice, 0),
              locale,
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
