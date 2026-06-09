"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import {
  LOUNGE_TYPES,
  VEHICLES,
  getCity,
  getStep,
} from "@/lib/domain";
import { useJourneyStore } from "@/store/journeyStore";
import { usePricing } from "@/components/pricing/PricingProvider";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { validateCustomer, validateJourney } from "@/lib/validation/journey";
import { submitJourney } from "@/server/actions/request.actions";
import { formatDateTime } from "@/lib/utils";

export default function ReviewPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";
  const store = useJourneyStore();
  const { config, total } = usePricing();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>();

  const draft = {
    selectedPackage: store.selectedPackage,
    steps: store.steps,
    customer: store.customer,
    phoneVerified: store.phoneVerified,
    emailVerified: store.emailVerified,
  };

  const validation = useMemo(() => validateJourney(draft), [JSON.stringify(draft)]);
  const customerErrors = useMemo(
    () => validateCustomer(store.customer).filter((i) => i.severity === "error"),
    [JSON.stringify(store.customer)],
  );
  const blocked = validation.hasErrors || customerErrors.length > 0;
  const estimatedTotal = total(store.steps);

  const ordered = [...store.steps].sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order);

  async function confirm() {
    setSubmitting(true);
    setServerError(undefined);
    const res = await submitJourney({
      selectedPackage: store.selectedPackage,
      steps: store.steps,
      customer: store.customer,
      phoneVerified: store.phoneVerified,
      emailVerified: store.emailVerified,
    });
    setSubmitting(false);
    if (!res.ok) return setServerError(res.error);
    const ref = res.referenceNumber!;
    store.reset();
    router.push(`/success/${ref}`);
  }

  return (
    <div className="ink-wrap rise pb-28 pt-6">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border" style={{ background: "rgba(95,174,126,.14)", borderColor: "rgba(95,174,126,.4)", color: "#5fae7e" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="disp mt-3 text-[25px] font-semibold text-cream">{pick(t.review.title)}</h1>
        <p className="mt-1.5 text-[14px] text-dim">
          {ar ? "الرياض" : "Riyadh"} ✈ {store.destination ? getCity(store.destination)?.name[locale] : ""} ✈ {ar ? "الرياض" : "Riyadh"}
        </p>
        <p className="mt-2 text-[12.5px] text-gold">{pick(t.builder.editHint ?? t.review.subtitle)}</p>
      </div>

      <div className="mt-5 grid gap-2.5">
        {ordered.map((step) => {
          const def = getStep(step.stepType);
          const on = !step.skipped && step.serviceType !== "SKIP";
          const price = computeStepPrice(step, config).computedPrice;
          const f = def.features;
          const update = (patch: Parameters<typeof store.updateStep>[1]) => store.updateStep(step.stepType, patch);

          return (
            <div key={step.stepType} className={`dcard p-3.5 ${on ? "" : "opacity-60"}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => update({ skipped: on })}
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border"
                  style={{
                    background: on ? "rgba(95,174,126,.18)" : "rgba(255,255,255,.05)",
                    borderColor: on ? "rgba(95,174,126,.45)" : "rgba(201,168,106,.22)",
                    color: on ? "#5fae7e" : "#8a9499",
                  }}
                >
                  {on ? "✓" : "+"}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-medium text-cream">{pick(def.name)}</div>
                  <div className="text-[12px] text-dim">
                    {step.city ? getCity(step.city)?.name[locale] : ""}
                    {step.date ? ` · ${formatDateTime(`${step.date}T${step.time ?? "00:00"}`, locale, { dateStyle: "short", timeStyle: step.time ? "short" : undefined })}` : ""}
                    {step.flightNumber ? ` · ${step.flightNumber}` : ""}
                  </div>
                </div>
                <div className={`whitespace-nowrap text-[13.5px] font-semibold ${on ? "text-gold" : "text-dim"}`}>
                  {on ? formatPrice(price, locale) : "—"}
                </div>
              </div>

              {/* Inline quick edits */}
              {on && (f.transfer || f.chauffeur) && (
                <div className="mt-2.5 flex gap-2">
                  {VEHICLES.map((v) => {
                    const sel = (step.carCategory ?? "VIP") === v.category;
                    return (
                      <button key={v.category} onClick={() => update({ carCategory: v.category })}
                        className={`flex-1 rounded-lg border py-1.5 text-[11.5px] ${sel ? "dcard-selected text-gold" : "gold-line text-dim"}`}>
                        {pick(v.name)}
                      </button>
                    );
                  })}
                </div>
              )}
              {on && f.assistance && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {LOUNGE_TYPES.map((o) => {
                    const sel = step.loungeType === o.value;
                    return (
                      <button key={o.value} onClick={() => update({ loungeType: o.value })}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11.5px] ${sel ? "dcard-selected text-gold" : "gold-line text-dim"}`}>
                        {pick(o.name)}
                      </button>
                    );
                  })}
                </div>
              )}
              {on && f.chauffeur && (
                <div className="mt-2.5 flex items-center justify-between rounded-lg border gold-line px-3 py-2" style={{ background: "rgba(255,255,255,.03)" }}>
                  <span className="text-[12.5px] text-dim">{pick(t.fields.days)}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => update({ days: Math.max(1, (step.days ?? 1) - 1) })} className="grid h-7 w-7 place-items-center rounded-md border gold-line text-gold">−</button>
                    <span className="disp text-[15px] font-semibold text-cream">{step.days ?? 1}</span>
                    <button onClick={() => update({ days: (step.days ?? 1) + 1 })} className="grid h-7 w-7 place-items-center rounded-md border gold-line text-gold">+</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Blocking issues */}
      {(blocked || validation.timeline.length > 0) && (
        <div className="mt-4 grid gap-1.5">
          {[...validation.timeline, ...customerErrors].map((iss, i) => (
            <p key={i} className="rounded-lg px-3 py-2 text-[12.5px]"
              style={{ background: iss.severity === "error" ? "rgba(211,112,95,.10)" : "rgba(217,164,65,.10)", color: iss.severity === "error" ? "#e69384" : "#d9a441" }}>
              {ar ? iss.messageAr : iss.messageEn}
            </p>
          ))}
        </div>
      )}

      {/* Estimated total */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border gold-line p-4" style={{ background: "linear-gradient(135deg, rgba(201,168,106,.14), rgba(201,168,106,.04))" }}>
        <span className="disp text-[18px] font-semibold text-cream">{pick(t.pricing.estimatedTotal)}</span>
        <span className="disp text-[25px] font-semibold text-gold">{formatPrice(estimatedTotal, locale)}</span>
      </div>
      <p className="mt-2 text-center text-[12.5px] text-dim">{pick(t.pricing.finalNote)}</p>

      {serverError && <p className="mt-3 text-center text-[13px] text-red-400">{serverError}</p>}

      <div className="mt-5 flex gap-2.5">
        <button onClick={() => router.push("/journey/details")} className="obtn">{ar ? "→" : "←"} {pick(t.common.back)}</button>
        <button onClick={confirm} disabled={blocked || submitting} className="gbtn flex-1">
          {submitting ? pick(t.common.loading) : pick(t.review.confirmRequest)}
        </button>
      </div>
    </div>
  );
}
