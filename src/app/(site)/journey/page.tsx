"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { CITIES, getCity, getStep } from "@/lib/domain";
import { ALL_STEPS, useJourneyStore } from "@/store/journeyStore";
import { usePricing } from "@/components/pricing/PricingProvider";
import { StepCard } from "@/components/journey/StepCard";
import { formatPrice } from "@/lib/pricing";

export default function JourneyPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";

  const destination = useJourneyStore((s) => s.destination);
  const steps = useJourneyStore((s) => s.steps);
  const initFlow = useJourneyStore((s) => s.initFlow);
  const setDestination = useJourneyStore((s) => s.setDestination);
  const updateStep = useJourneyStore((s) => s.updateStep);

  const { total } = usePricing();
  const [stage, setStage] = useState<"destination" | "flow">(destination ? "flow" : "destination");
  const [idx, setIdx] = useState(0);

  const Back = ar ? "→" : "←";
  const Fwd = ar ? "←" : "→";

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

  // ── Destination picker ──
  if (stage === "destination") {
    return (
      <div className="ink-wrap rise pb-20 pt-6">
        <h1 className="disp text-[26px] font-semibold text-cream">{pick(t.builder.chooseDestination)}</h1>
        <p className="mb-5 mt-1.5 text-[14.5px] text-dim">{pick(t.builder.chooseDestinationSub)}</p>
        <div className="grid gap-3">
          {CITIES.filter((c) => c.code !== "RUH").map((d) => (
            <button
              key={d.code}
              onClick={() => pickDestination(d.code)}
              className="dcard-soft p-4 text-start"
              style={{ textAlign: ar ? "right" : "left" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border gold-line text-gold" style={{ background: "rgba(201,168,106,.12)" }}>
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" /></svg>
                  </span>
                  <div>
                    <div className="disp text-[18px] font-semibold text-cream">{pick(d.name)}</div>
                    <div className="mt-0.5 text-[12px] text-dim">{d.airports[0].code} · {pick(d.airports[0].name)}</div>
                  </div>
                </div>
                <span className="text-gold">{Fwd}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step-by-step flow ──
  const def = ALL_STEPS[idx];
  const step = steps.find((s) => s.stepType === def.type);
  const progress = Math.round((idx / ALL_STEPS.length) * 100);
  const routeStr = `${ar ? "الرياض" : "Riyadh"} ✈ ${destination ? getCity(destination)?.name[locale] : ""} ✈ ${ar ? "الرياض" : "الرياض"}`;
  const runningTotal = total(steps);

  if (!step) return null;

  return (
    <div className="ink-wrap pb-28 pt-5">
      {/* Route bar */}
      <div className="mb-3 flex items-center justify-between rounded-xl border gold-line bg-ink-800 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-[13.5px] text-cream">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a86a" strokeWidth="2"><path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" /></svg>
          {ar ? "الرياض" : "Riyadh"} ✈ {destination ? getCity(destination)?.name[locale] : ""} ✈ {ar ? "الرياض" : "Riyadh"}
        </span>
        <button onClick={() => setStage("destination")} className="text-[13px] text-gold">{pick(t.builder.change)}</button>
      </div>

      {/* Back + progress */}
      <div className="mb-3 flex items-center gap-2.5">
        <button onClick={back} className="flex items-center gap-1 rounded-lg border gold-line px-3 py-1.5 text-[13.5px] text-cream">
          {Back} {pick(t.common.back)}
        </button>
        <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.06)" }}>
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mb-4 flex justify-between text-[12.5px]">
        <span className="text-gold">{pick(def.cityScope === "RIYADH" ? { en: "Riyadh", ar: "الرياض" } : (def.name))}</span>
        <span className="text-dim">{pick(t.common.step)} {idx + 1} {pick(t.common.of)} {ALL_STEPS.length}</span>
      </div>

      {/* Step card */}
      <div key={def.type} className="rise rounded-2xl border gold-line bg-ink-800 p-5">
        <div className="flex items-start gap-3.5">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border gold-line text-[15px] font-semibold text-gold" style={{ background: "rgba(201,168,106,.12)" }}>
            {def.order}
          </span>
          <div>
            <div className="flex items-center gap-1.5 text-[12px] text-dim">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.5" /></svg>
              {step.city ? getCity(step.city)?.name[locale] : ""}
            </div>
            <h2 className="disp mt-1 text-[21px] font-semibold leading-tight text-cream">{pick(def.name)}</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-dim">{pick(def.description)}</p>
          </div>
        </div>

        <div className="mt-5">
          <StepCard step={step} onChange={(patch) => updateStep(def.type, patch)} />
        </div>

        {/* Add / Skip */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={() => { updateStep(def.type, { skipped: false }); advance(); }}
            className="gbtn flex-1"
          >
            ✓ {step.skipped === false ? pick(t.builder.stepIncluded) : pick(t.builder.addService)}
          </button>
          <button onClick={() => { updateStep(def.type, { skipped: true }); advance(); }} className="obtn">
            {pick(t.common.skip)}
          </button>
        </div>
      </div>

      {/* Sticky running total */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t gold-line" style={{ background: "rgba(11,20,24,.92)", backdropFilter: "blur(12px)" }}>
        <div className="ink-wrap flex items-center justify-between py-3">
          <span className="flex items-center gap-2 text-[13px] text-dim">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>
            {pick(t.builder.totalSoFar)}
          </span>
          <span className="disp text-[19px] font-semibold text-gold">{formatPrice(runningTotal, locale)}</span>
        </div>
      </div>
    </div>
  );
}
