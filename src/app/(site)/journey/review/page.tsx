"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { VEHICLES, getStep, getVehicle } from "@/lib/domain";
import { useJourneyStore } from "@/store/journeyStore";
import { usePricing } from "@/components/pricing/PricingProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { validateJourney } from "@/lib/validation/journey";
import { submitJourney } from "@/server/actions/request.actions";
import { formatDateOnly, formatDateTime } from "@/lib/utils";

export default function ReviewPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";
  const store = useJourneyStore();
  const { config } = usePricing();
  const catalog = useCatalog();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>();

  const draft = {
    selectedPackage: store.selectedPackage,
    steps: store.steps,
    customer: store.customer,
    tripInfo: store.tripInfo,
    phoneVerified: store.phoneVerified,
    emailVerified: store.emailVerified,
  };

  // validateJourney already folds in trip-info + customer validation.
  const validation = useMemo(() => validateJourney(draft), [JSON.stringify(draft)]);
  const blocked = validation.hasErrors;

  const ordered = [...store.steps].sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order);
  const estimatedTotal = ordered.filter((s) => !s.skipped && s.serviceType !== "SKIP").reduce((sum, s) => sum + computeStepPrice(s, config).computedPrice, 0);

  async function confirm() {
    setSubmitting(true); setServerError(undefined);
    const res = await submitJourney({ ...draft, destination: store.destination });
    setSubmitting(false);
    if (!res.ok) return setServerError(res.error);
    const ref = res.referenceNumber!;
    store.reset();
    router.push(`/success/${ref}`);
  }

  const allIssues = validation.timeline;

  return (
    <div className="luxe-container max-w-6xl py-10 md:py-14">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.review.title)}</h1>
        <p className="mt-2 text-sm text-charcoal/60">
          {ar ? "الرياض" : "Riyadh"} ✈ {catalog.cityName(store.destination, locale)} ✈ {ar ? "الرياض" : "Riyadh"}
        </p>
        <p className="mt-1 text-xs text-gold-dark">{pick(t.builder.editHint)}</p>
      </div>

      {/* Flight summary */}
      <FlightSummary />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Itinerary */}
        <div className="space-y-3">
          {ordered.map((step) => {
            const def = getStep(step.stepType);
            const on = !step.skipped && step.serviceType !== "SKIP";
            const price = computeStepPrice(step, config).computedPrice;
            const f = def.features;
            const update = (patch: Parameters<typeof store.updateStep>[1]) => store.updateStep(step.stepType, patch);
            const cap = step.carCategory ? getVehicle(step.carCategory).maxPassengers : Infinity;
            const overCap = on && step.passengers != null && step.passengers > cap;

            return (
              <div key={step.stepType} className={`luxe-card p-5 ${on ? "" : "opacity-60"} ${overCap ? "ring-1 ring-red-300" : ""}`}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (on) { update({ skipped: true }); return; }
                      // Adding an assistance step → ensure a selected option (recommended default).
                      const patch: Parameters<typeof store.updateStep>[1] = { skipped: false };
                      if (f.assistance && !step.loungeType) patch.loungeType = catalog.loungeOptions(step.city)[0]?.value;
                      update(patch);
                    }}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-base ${on ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-charcoal/15 bg-white text-charcoal/40"}`}
                  >
                    {on ? "✓" : "+"}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-charcoal">{pick(def.name)}</p>
                    <p className="truncate text-xs text-charcoal/45">
                      {catalog.cityName(step.city, locale)}
                      {step.date ? ` · ${formatDateTime(`${step.date}T${step.time ?? "00:00"}`, locale, { dateStyle: "short", timeStyle: step.time ? "short" : undefined })}` : ""}
                      {step.flightNumber ? ` · ${step.flightNumber}` : ""}
                    </p>
                  </div>
                  <span className={`whitespace-nowrap font-semibold ${on ? "text-charcoal" : "text-charcoal/40"}`}>{on ? formatPrice(price, locale) : "—"}</span>
                </div>

                {on && (f.transfer || f.chauffeur) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {VEHICLES.map((v) => {
                      const sel = (step.carCategory ?? "VIP") === v.category;
                      return (
                        <button key={v.category} onClick={() => update({ carCategory: v.category })} className={`pill ${sel ? "pill-on" : ""}`}>
                          {pick(v.name)} · {formatPrice(computeStepPrice({ ...step, carCategory: v.category }, config).computedPrice, locale)}
                        </button>
                      );
                    })}
                  </div>
                )}
                {on && f.assistance && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {catalog.loungeOptions(step.city).map((o) => {
                      const sel = step.loungeType === o.value;
                      return (
                        <button key={o.value} onClick={() => update({ loungeType: o.value })} className={`pill ${sel ? "pill-on" : ""}`}>
                          {pick(o.name)} · {formatPrice(computeStepPrice({ ...step, loungeType: o.value }, config).computedPrice, locale)}
                        </button>
                      );
                    })}
                  </div>
                )}
                {on && f.chauffeur && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-ivory-warm px-3 py-2">
                    <span className="text-xs text-charcoal/55">{pick(t.fields.days)}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => update({ days: Math.max(1, (step.days ?? 1) - 1) })} className="stepper-btn h-7 w-7 text-base">−</button>
                      <span className="font-semibold text-charcoal">{step.days ?? 1}</span>
                      <button onClick={() => update({ days: (step.days ?? 1) + 1 })} className="stepper-btn h-7 w-7 text-base">+</button>
                    </div>
                  </div>
                )}
                {overCap && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {ar
                      ? `فئة ${getVehicle(step.carCategory!).name.ar} تدعم حتى ${cap} ركاب فقط. الرجاء تقليل عدد الركاب أو اختيار فئة أكبر.`
                      : `${getVehicle(step.carCategory!).name.en} supports up to ${cap} passengers. Please reduce passengers or pick a larger class.`}
                  </p>
                )}
              </div>
            );
          })}

          {allIssues.length > 0 && (
            <div className="grid gap-1.5">
              {allIssues.map((iss, i) => (
                <p key={i} className={`rounded-xl px-3 py-2 text-xs ${iss.severity === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{ar ? iss.messageAr : iss.messageEn}</p>
              ))}
            </div>
          )}
        </div>

        {/* Pricing summary + confirm */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="luxe-card p-6">
            <div className="rounded-xl bg-gold-50 p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-charcoal">{pick(t.pricing.estimatedTotal)}</span>
                <span className="font-serif text-2xl font-semibold text-gold-dark">{formatPrice(estimatedTotal, locale)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-charcoal/50">{pick(t.pricing.finalNote)}</p>

            {blocked && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{pick(t.review.blockingError)}</p>}
            {serverError && <p className="mt-3 text-xs text-red-600">{serverError}</p>}

            <button onClick={confirm} disabled={blocked || submitting} className="btn-gold mt-5 w-full">
              {submitting ? pick(t.common.loading) : pick(t.review.confirmRequest)}
            </button>
            <button onClick={() => router.push("/journey/details")} className="btn-ghost mt-2 w-full">{ar ? "→" : "←"} {pick(t.common.back)}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Flight summary card: departure/return flight, route, times, and source. */
function FlightSummary() {
  const { t, pick, locale } = useI18n();
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const dep = tripInfo.departureFlight;
  const ret = tripInfo.returnFlight;
  const hasAny = dep || ret || tripInfo.departureFlightCode || tripInfo.returnFlightCode;
  if (!hasAny) return null;

  const sourceLabel = (status?: string) =>
    status === "static_matched" ? pick(t.tripInfo.sourceStatic) : status === "not_found" ? pick(t.tripInfo.sourceNotFound) : pick(t.tripInfo.sourceManual);

  const Leg = ({ label, code, resolved, manualTime, status }: { label: string; code?: string; resolved?: any; manualTime?: string; status?: string }) => {
    if (!resolved && !code) return null;
    return (
      <div className="rounded-xl border border-charcoal/10 bg-white p-3 text-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-charcoal/45">{label}</span>
          <span className={`badge ${status === "static_matched" ? "bg-emerald-50 text-emerald-700" : status === "not_found" ? "bg-amber-50 text-amber-700" : "bg-charcoal/5 text-charcoal/50"}`}>
            {sourceLabel(status)}
          </span>
        </div>
        {resolved ? (
          <p className="text-charcoal">
            <span className="font-semibold">{resolved.flightCode}</span> · {resolved.airline} · {resolved.originAirport}→{resolved.destinationAirport}
            <br />
            <span className="text-charcoal/60">{formatDateOnly(resolved.departureDate, locale)} {resolved.departureTimeLocal} · {pick(t.tripInfo.estArrival)} {formatDateOnly(resolved.estimatedArrivalDate, locale)} {resolved.estimatedArrivalTimeLocal}</span>
          </p>
        ) : (
          <p className="text-charcoal">
            <span className="font-semibold">{code}</span>
            {manualTime ? <span className="text-charcoal/60"> · {manualTime}</span> : null}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6 luxe-card p-5">
      <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">{pick(t.fields.flightNumber)}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Leg label={pick(t.tripInfo.departureFlight)} code={tripInfo.departureFlightCode} resolved={dep} manualTime={tripInfo.departureTime} status={tripInfo.departureLookupStatus} />
        <Leg label={pick(t.tripInfo.returnFlight)} code={tripInfo.returnFlightCode} resolved={ret} manualTime={tripInfo.returnTime} status={tripInfo.returnLookupStatus} />
      </div>
      <p className="mt-3 text-[11px] text-charcoal/45">{pick(t.tripInfo.scheduleDisclaimer)}</p>
    </div>
  );
}
