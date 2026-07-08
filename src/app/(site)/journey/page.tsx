"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useJourneyStore } from "@/store/journeyStore";
import { usePricing } from "@/components/pricing/PricingProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { useVehicles } from "@/components/vehicles/VehicleProvider";
import { useStepCatalog } from "@/components/steps/StepCatalogProvider";
import { stepSideFromOrder } from "@/lib/domain";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { hasCityPricing, isStepOffered } from "@/lib/availability";
import { hasReturnTiming } from "@/lib/service-timing";
import { validateCustomer, validateStep, validateTripInfo } from "@/lib/validation/journey";
import { COUNTRY_CODES } from "@/lib/phone";
import { resolveFlightAction } from "@/server/actions/flight.actions";
import { cn, formatDateOnly } from "@/lib/utils";
import type { ResolvedFlight } from "@/lib/flight";
import { StepCard } from "@/components/journey/StepCard";
import { JourneySummary } from "@/components/journey/JourneySummary";
import { TripSummaryBar } from "@/components/journey/TripSummaryBar";
import { DateField, TimeField } from "@/components/ui/DateTimeField";

const today = () => new Date().toISOString().slice(0, 10);

export default function JourneyPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";

  const destination = useJourneyStore((s) => s.destination);
  const steps = useJourneyStore((s) => s.steps);
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const setDestination = useJourneyStore((s) => s.setDestination);
  const initFlow = useJourneyStore((s) => s.initFlow);
  const updateStep = useJourneyStore((s) => s.updateStep);
  const draftExpired = useJourneyStore((s) => s.draftExpired);
  const clearExpiredNotice = useJourneyStore((s) => s.clearExpiredNotice);
  const resetDraft = useJourneyStore((s) => s.reset);
  const { config } = usePricing();
  const catalog = useCatalog();
  const { capacityByCategory } = useVehicles();
  const { steps: catalogSteps } = useStepCatalog();

  // Services shown for this journey. A step is hidden when it's disabled globally
  // (Pricing page) or for its governing city (Cities page) — Riyadh-side steps
  // follow RUH, destination-side steps follow the chosen destination — OR when it
  // has no effective price for that city (0 / unset never reaches the customer).
  const disabledInRiyadh = new Set(catalog.city("RUH")?.disabledSteps ?? []);
  const disabledInDestination = new Set(catalog.city(destination)?.disabledSteps ?? []);
  const cityLoungePrices = (code: string | null | undefined) =>
    (catalog.city(code)?.airports ?? []).flatMap((a) => a.lounges.map((l) => l.price));
  // Only hide unpriced steps when pricing actually loaded. If the pricing/catalog
  // fetch fell back to empty defaults, keep showing steps (fail open) rather than
  // leaving the customer with an empty flow.
  const priceKnown = hasCityPricing(config);
  const flowSteps = catalogSteps.filter((def) => {
    const cityCode = def.cityScope === "RIYADH" ? "RUH" : destination;
    const disabled = def.cityScope === "RIYADH" ? disabledInRiyadh : disabledInDestination;
    if (disabled.has(def.type)) return false;
    return priceKnown ? isStepOffered(def, cityCode, config, cityLoungePrices(cityCode)) : true;
  });

  const [stage, setStage] = useState<"destination" | "tripinfo" | "flow">(
    destination ? (tripInfo.departureDate ? "flow" : "tripinfo") : "destination",
  );
  const [idx, setIdx] = useState(0);

  // The draft persists to localStorage but is not hydrated during SSR (so the
  // server and first client render match). Rehydrate on mount, then resume at
  // the correct stage for whatever draft was restored.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve(useJourneyStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const { destination: d, tripInfo: ti } = useJourneyStore.getState();
    setStage(d ? (ti.departureDate ? "flow" : "tripinfo") : "destination");
    setIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // If the persisted draft expired while away, snap back to a clean first step.
  useEffect(() => {
    if (draftExpired) {
      setStage("destination");
      setIdx(0);
    }
  }, [draftExpired]);

  function pickDestination(code: string) {
    clearExpiredNotice();
    setDestination(code);
    setStage("tripinfo");
  }

  function startNewBooking() {
    resetDraft();
    setStage("destination");
    setIdx(0);
  }

  const expiredBanner = draftExpired ? (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span>{pick(t.builder.draftExpired)}</span>
      <button onClick={clearExpiredNotice} className="shrink-0 text-amber-700 hover:text-amber-900" aria-label="dismiss">✕</button>
    </div>
  ) : null;
  function startFlow() {
    initFlow(destination ?? undefined, flowSteps);
    setIdx(0);
    setStage("flow");
  }
  function advance() {
    if (idx < flowSteps.length - 1) setIdx(idx + 1);
    else router.push("/journey/review");
  }
  function back() {
    if (idx > 0) setIdx(idx - 1);
    else setStage("tripinfo");
  }

  // ─────────── Destination picker ───────────
  if (stage === "destination") {
    return (
      <div className="luxe-container max-w-4xl py-12 md:py-16">
        {expiredBanner}
        <div className="mb-10 text-center">
          <div className="gold-rule mx-auto mb-5" />
          <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.builder.chooseDestination)}</h1>
          <p className="mx-auto mt-3 max-w-md text-charcoal/60">{pick(t.builder.chooseDestinationSub)}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {catalog.destinations.map((d) => (
            <button key={d.code} onClick={() => pickDestination(d.code)} className="sel-card flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-charcoal text-gold-light">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" /></svg>
                </span>
                <div>
                  <div className="font-serif text-lg font-semibold text-charcoal">{ar ? d.nameAr : d.nameEn}</div>
                  {d.airports[0] && <div className="text-xs text-charcoal/50">{d.airports[0].code} · {ar ? d.airports[0].nameAr : d.airports[0].nameEn}</div>}
                </div>
              </div>
              <span className="text-gold-dark rtl:rotate-180">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────── Trip Information ───────────
  if (stage === "tripinfo") {
    return <TripInfoStage onBack={() => setStage("destination")} onContinue={startFlow} />;
  }

  // ─────────── No services priced for this destination yet ───────────
  if (flowSteps.length === 0) {
    return (
      <div className="luxe-container max-w-xl py-16 text-center md:py-24">
        {expiredBanner}
        <div className="gold-rule mx-auto mb-5" />
        <h1 className="text-2xl font-semibold text-charcoal md:text-3xl">{pick(t.builder.noServicesTitle)}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-charcoal/60">{pick(t.builder.noServicesBody)}</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => setStage("destination")} className="btn-gold">{pick(t.builder.chooseDestination)}</button>
        </div>
      </div>
    );
  }

  // ─────────── Step-by-step flow ───────────
  const def = flowSteps[Math.min(idx, flowSteps.length - 1)];
  const step = steps.find((s) => s.stepType === def.type);
  const progress = Math.round((idx / flowSteps.length) * 100);
  if (!step) return null;

  const subtotal = computeStepPrice({ ...step, skipped: false }, config).computedPrice;
  // Date/time is the Trip Information's job — it auto-fills every step. Departure
  // steps never re-ask. For RETURN steps, if the return date/time wasn't entered
  // up front we collect it once here (the return source of truth); once set, it
  // propagates to every later return step and is never asked again.
  const isReturnStep = stepSideFromOrder(def.order) === "RETURN";
  const returnReady = hasReturnTiming(tripInfo);
  const collectReturnTiming = isReturnStep && !returnReady;
  const stepValidation = validateStep({ ...step, skipped: false }, new Date(), capacityByCategory);
  // Assistance steps require an explicit option (lounge / airport service) before
  // they can be added. Transfer/chauffeur steps have a visible default vehicle.
  const needsService = def.features.assistance && !step.loungeType;
  const blockAdd =
    stepValidation.errors.some((e) => e.field === "passengers") || needsService || collectReturnTiming;

  return (
    // Extra bottom padding below `lg` so the last Add/Skip buttons clear the
    // fixed running-total bar (which is only shown on mobile/tablet).
    <div className="luxe-container max-w-6xl pt-8 pb-28 md:pt-12 lg:pb-12">
      {expiredBanner}
      {/* Single integrated summary card: route · auto-filled trip info · actions */}
      <TripSummaryBar onChangeDestination={() => setStage("destination")} onStartNew={startNewBooking} />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <button onClick={back} className="btn-outline px-4 py-2 text-xs">{ar ? "→" : "←"} {pick(t.common.back)}</button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal/10">
              <div className="h-full rounded-full bg-gold-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-charcoal/50">{pick(t.common.step)} {idx + 1} {pick(t.common.of)} {flowSteps.length}</span>
          </div>

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

            {collectReturnTiming && <ReturnTimingPrompt />}

            <div className="mt-6">
              <StepCard step={step} onChange={(patch) => updateStep(def.type, patch)} needsTimeInput={false} />
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-ivory-warm px-4 py-3">
              <span className="text-sm text-charcoal/60">{pick(t.builder.estimatedPrice)}</span>
              <span className="font-serif text-lg font-semibold text-gold-dark">{formatPrice(subtotal, locale)}</span>
            </div>
            {needsService && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{pick(t.builder.selectServicePrompt)}</p>
            )}
            {collectReturnTiming && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{pick(t.builder.selectReturnTiming)}</p>
            )}
            <div className="mt-4 flex gap-3">
              <button onClick={() => { if (blockAdd) return; updateStep(def.type, { skipped: false }); advance(); }} disabled={blockAdd} className="btn-gold flex-1">
                ✓ {pick(t.builder.addService)}
              </button>
              <button onClick={() => { updateStep(def.type, { skipped: true }); advance(); }} className="btn-outline">{pick(t.common.skip)}</button>
            </div>
          </div>
        </div>

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

/**
 * Collects the return journey's date & time once, on the first return-side step
 * the customer reaches without it. Writing here updates Trip Information (the
 * source of truth) and re-applies it to every step, so later return services
 * reuse the same smart timing and never ask again.
 */
function ReturnTimingPrompt() {
  const { t, pick } = useI18n();
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const setTripInfo = useJourneyStore((s) => s.setTripInfo);
  const applyTripInfoToSteps = useJourneyStore((s) => s.applyTripInfoToSteps);
  const update = (patch: Parameters<typeof setTripInfo>[0]) => { setTripInfo(patch); applyTripInfoToSteps(); };

  return (
    <div className="mt-6 rounded-2xl border border-gold/40 bg-gold-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-charcoal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8854a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-3-6.7M21 4v4h-4" /></svg>
        {pick(t.builder.returnTimingTitle)}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-charcoal/55">{pick(t.builder.returnTimingHint)}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="field-label">{pick(t.tripInfo.returnDate)}</span>
          <DateField value={tripInfo.returnDate} min={tripInfo.departureDate || today()} onChange={(v) => update({ returnDate: v })} />
        </div>
        <div>
          <span className="field-label">{pick(t.tripInfo.returnTime)}</span>
          <TimeField value={tripInfo.returnTime} onChange={(v) => update({ returnTime: v })} />
        </div>
      </div>
    </div>
  );
}

/** Trip Information — collected once at the start, auto-filled into later steps. */
function TripInfoStage({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const customer = useJourneyStore((s) => s.customer);
  const setCustomer = useJourneyStore((s) => s.setCustomer);
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const setTripInfo = useJourneyStore((s) => s.setTripInfo);

  const [attempted, setAttempted] = useState(false);

  // Collect field-level errors from the shared validators (errors only).
  const issues = [
    ...validateCustomer({ ...customer, language: locale }),
    ...validateTripInfo(tripInfo),
  ].filter((i) => i.severity === "error");
  const errFor = (field: string) => {
    const i = issues.find((x) => x.field === field);
    return i ? (ar ? i.messageAr : i.messageEn) : undefined;
  };
  const canContinue = issues.length === 0;
  // Order in which required fields appear, for focusing the first missing one.
  const FIELD_ORDER = ["fullName", "phone", "departureDate", "departureTime", "passengers", "bags", "returnDate", "email"];

  function cont() {
    setAttempted(true);
    if (!canContinue) {
      const first = FIELD_ORDER.find((f) => errFor(f));
      if (first) {
        const el = document.getElementById(`ti-${first}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => (el as HTMLElement | null)?.focus?.(), 250);
      }
      return;
    }
    setCustomer({ language: locale });
    onContinue();
  }

  const showErr = (field: string) => (attempted ? errFor(field) : undefined);

  return (
    <div className="luxe-container max-w-2xl py-10 md:py-14">
      <div className="mb-8 text-center">
        <div className="gold-rule mx-auto mb-5" />
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.tripInfo.title)}</h1>
        <p className="mx-auto mt-3 max-w-md text-charcoal/60">{pick(t.tripInfo.subtitle)}</p>
      </div>

      <div className="luxe-card space-y-5 p-6 md:p-8">
        <Field label={pick(t.fields.fullName)} error={showErr("fullName")}>
          <input id="ti-fullName" className={cn("field-input", showErr("fullName") && "field-input-error")} value={customer.fullName} onChange={(e) => setCustomer({ fullName: e.target.value })} placeholder={ar ? "الاسم الكامل" : "Your full name"} />
        </Field>

        <div>
          <span className="field-label">{pick(t.fields.phone)}</span>
          <div className="flex gap-2">
            <select className="field-input w-32 shrink-0" value={customer.phoneCountry} onChange={(e) => setCustomer({ phoneCountry: e.target.value })}>
              {COUNTRY_CODES.map((c) => (<option key={c.code} value={c.code}>{c.dial} {c.code}</option>))}
            </select>
            <input id="ti-phone" className={cn("field-input flex-1", showErr("phone") && "field-input-error")} inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ phone: e.target.value })} placeholder="5XXXXXXXX" />
          </div>
          {showErr("phone") && <p className="mt-1 text-xs text-red-600">{showErr("phone")}</p>}
        </div>

        <Field label={`${pick(t.fields.email)} — ${pick(t.common.optional)}`} error={showErr("email")}>
          <input id="ti-email" className={cn("field-input", showErr("email") && "field-input-error")} inputMode="email" value={customer.email} onChange={(e) => setCustomer({ email: e.target.value })} placeholder="name@example.com" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={pick(t.tripInfo.departureDate)} error={showErr("departureDate")}>
            <div id="ti-departureDate">
              <DateField value={tripInfo.departureDate} min={today()} error={!!showErr("departureDate")} onChange={(v) => setTripInfo({ departureDate: v })} />
            </div>
          </Field>
          <Field label={`${pick(t.tripInfo.returnDate)} — ${pick(t.common.optional)}`} error={showErr("returnDate")}>
            <div id="ti-returnDate">
              <DateField value={tripInfo.returnDate} min={tripInfo.departureDate || today()} error={!!showErr("returnDate")} onChange={(v) => setTripInfo({ returnDate: v })} />
            </div>
          </Field>
        </div>

        {/* Flight details (resolved from the static schedule) */}
        <FlightField leg="DEPARTURE" timeError={showErr("departureTime")} />
        {tripInfo.returnDate && <FlightField leg="RETURN" timeError={showErr("returnTime")} />}
        <p className="rounded-lg bg-ivory-warm px-3 py-2 text-[11px] text-charcoal/50">{pick(t.tripInfo.scheduleDisclaimer)}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Stepper label={pick(t.fields.passengers)} value={tripInfo.passengers} min={1} onChange={(v) => setTripInfo({ passengers: v })} />
          <Stepper label={pick(t.fields.bags)} value={tripInfo.bags} min={0} onChange={(v) => setTripInfo({ bags: v })} />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-ivory-warm p-4">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-gold" checked={tripInfo.specialAssistance} onChange={(e) => setTripInfo({ specialAssistance: e.target.checked })} />
          <span className="text-sm text-charcoal/80">{pick(t.tripInfo.specialAssistance)}</span>
        </label>
        {tripInfo.specialAssistance && (
          <Field label={pick(t.tripInfo.assistanceNotes)}>
            <textarea className="field-input min-h-[80px] resize-y" value={tripInfo.assistanceNotes ?? ""} onChange={(e) => setTripInfo({ assistanceNotes: e.target.value })} placeholder={pick(t.tripInfo.assistanceHint)} />
          </Field>
        )}

        {attempted && !canContinue && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {ar ? "يرجى تعبئة الحقول المطلوبة المميّزة بالأحمر." : "Please complete the required fields highlighted in red."}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <button type="button" onClick={onBack} className="btn-ghost">{ar ? "→" : "←"} {pick(t.common.back)}</button>
          <button type="button" onClick={cont} className="btn-gold">{pick(t.common.next)} {ar ? "←" : "→"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

/** Flight number entry with static-schedule lookup + manual fallback. */
function FlightField({ leg, timeError }: { leg: "DEPARTURE" | "RETURN"; timeError?: string }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const setTripInfo = useJourneyStore((s) => s.setTripInfo);
  const [matches, setMatches] = useState<ResolvedFlight[] | null>(null);
  const [busy, setBusy] = useState(false);

  const isDep = leg === "DEPARTURE";
  const code = (isDep ? tripInfo.departureFlightCode : tripInfo.returnFlightCode) ?? "";
  const date = isDep ? tripInfo.departureDate : tripInfo.returnDate;
  const resolved = isDep ? tripInfo.departureFlight : tripInfo.returnFlight;
  const status = isDep ? tripInfo.departureLookupStatus : tripInfo.returnLookupStatus;
  const manualTime = (isDep ? tripInfo.departureTime : tripInfo.returnTime) ?? "";

  function patch(p: Partial<typeof tripInfo>) { setTripInfo(p); }

  async function find() {
    if (!code || !date) return;
    setBusy(true);
    setMatches(null);
    const res = await resolveFlightAction(code, date);
    setBusy(false);
    if (res.status === "not_found") {
      patch(isDep ? { departureFlight: null, departureLookupStatus: "not_found" } : { returnFlight: null, returnLookupStatus: "not_found" });
      setMatches([]);
    } else if (res.matches.length === 1) {
      choose(res.matches[0]);
    } else {
      setMatches(res.matches);
    }
  }

  // Re-resolve automatically when the trip date changes (the weekday — hence the
  // schedule match — depends on it). Clears any stale "not found" result.
  const prevDate = useRef(date);
  useEffect(() => {
    if (prevDate.current === date) return;
    prevDate.current = date;
    setMatches(null);
    if (code && date) void find();
    else patch(isDep ? { departureFlight: null, departureLookupStatus: undefined } : { returnFlight: null, returnLookupStatus: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function choose(f: ResolvedFlight) {
    patch(isDep ? { departureFlight: f, departureLookupStatus: "static_matched", departureTime: "" } : { returnFlight: f, returnLookupStatus: "static_matched", returnTime: "" });
    setMatches(null);
  }

  return (
    <div>
      <span className="field-label">{pick(isDep ? t.tripInfo.departureFlight : t.tripInfo.returnFlight)}{!isDep ? ` — ${pick(t.common.optional)}` : ""}</span>
      <div className="flex gap-2">
        <input
          className="field-input flex-1"
          value={code}
          placeholder="SV111"
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            patch(isDep ? { departureFlightCode: v, departureFlight: null, departureLookupStatus: undefined } : { returnFlightCode: v, returnFlight: null, returnLookupStatus: undefined });
            setMatches(null);
          }}
        />
        <button onClick={find} disabled={busy || !code || !date} className="btn-outline shrink-0 px-4 py-2 text-xs">
          {busy ? "…" : pick(t.tripInfo.findFlight)}
        </button>
      </div>

      {/* Multiple matches → selection */}
      {matches && matches.length > 1 && (
        <div className="mt-2 grid gap-2">
          <p className="text-xs text-charcoal/60">{pick(t.tripInfo.chooseFlight)}</p>
          {matches.map((f, i) => (
            <button key={i} onClick={() => choose(f)} className="sel-card flex items-center justify-between p-3 text-start">
              <span className="text-sm font-medium text-charcoal">{f.flightCode} · {f.airline}</span>
              <span className="text-xs text-charcoal/60">{f.originAirport}→{f.destinationAirport} · {f.departureTimeLocal}</span>
            </button>
          ))}
        </div>
      )}

      {/* Matched */}
      {resolved && (
        <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          ✓ {pick(t.tripInfo.flightMatched)} — {resolved.airline} {resolved.flightCode} · {resolved.originAirport}→{resolved.destinationAirport} · {resolved.departureTimeLocal}
          <span className="text-emerald-700/70"> · {pick(t.tripInfo.estArrival)} {resolved.estimatedArrivalTimeLocal} ({formatDateOnly(resolved.estimatedArrivalDate, locale)})</span>
        </div>
      )}

      {/* Manual time — always available when no flight is resolved (so the
          customer can provide a time even without a schedule match). */}
      {!resolved && (
        <div className="mt-2 space-y-2">
          {status === "not_found" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{pick(t.tripInfo.flightNotFound)}</p>
          )}
          <div className="block">
            <span className="field-label">{pick(t.tripInfo.flightTime)}{!isDep ? ` — ${pick(t.common.optional)}` : ""}</span>
            <div id={isDep ? "ti-departureTime" : "ti-returnTime"}>
              <TimeField
                value={manualTime}
                error={!!timeError}
                onChange={(v) => patch(isDep ? { departureTime: v } : { returnTime: v })}
              />
            </div>
            {timeError && <span className="mt-1 block text-xs text-red-600">{timeError}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-white px-4 py-2.5 shadow-sm">
        <span className="text-sm text-charcoal/60">{label}</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="stepper-btn">−</button>
          <span className="min-w-5 text-center text-lg font-semibold text-charcoal">{value}</span>
          <button type="button" onClick={() => onChange(value + 1)} className="stepper-btn">+</button>
        </div>
      </div>
    </div>
  );
}
