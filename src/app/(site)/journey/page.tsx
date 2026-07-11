"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useJourneyStore } from "@/store/journeyStore";
import { usePricing } from "@/components/pricing/PricingProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { useVehicles } from "@/components/vehicles/VehicleProvider";
import { useStepCatalog } from "@/components/steps/StepCatalogProvider";
import { stepSideFromOrder, type StepDef, type Bilingual } from "@/lib/domain";
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

/**
 * The three phases of the journey builder. Each service belongs to exactly one
 * phase, derived from its canonical side (departure/return) and city scope — no
 * per-service metadata is needed:
 *   1. Outbound from Riyadh — the departure-side Riyadh services (steps 1–2)
 *   2. At Your Destination  — the departure-side destination services (steps 3–5, incl. chauffeur)
 *   3. Your Return          — every return-side service (steps 6–9)
 * The Return phase is a review/customization phase: it's seeded once from the
 * outbound selections (see the store's mirror) and is only shown for round trips.
 */
type PhaseKey = "outbound" | "destination" | "return";

interface PhaseDef {
  key: PhaseKey;
  title: Bilingual;
  subtitle: Bilingual;
  /** Whether this phase collects the return leg (shown only when a return date exists). */
  isReturn: boolean;
  inPhase: (def: StepDef) => boolean;
}

function buildPhases(t: ReturnType<typeof useI18n>["t"]): PhaseDef[] {
  return [
    {
      key: "outbound",
      title: t.builder.phaseOutboundTitle,
      subtitle: t.builder.phaseOutboundSub,
      isReturn: false,
      inPhase: (d) => stepSideFromOrder(d.order) === "DEPARTURE" && d.cityScope === "RIYADH",
    },
    {
      key: "destination",
      title: t.builder.phaseDestinationTitle,
      subtitle: t.builder.phaseDestinationSub,
      isReturn: false,
      inPhase: (d) => stepSideFromOrder(d.order) === "DEPARTURE" && d.cityScope === "DESTINATION",
    },
    {
      key: "return",
      title: t.builder.phaseReturnTitle,
      subtitle: t.builder.phaseReturnSub,
      isReturn: true,
      inPhase: (d) => stepSideFromOrder(d.order) === "RETURN",
    },
  ];
}

export default function JourneyPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";

  const destination = useJourneyStore((s) => s.destination);
  const steps = useJourneyStore((s) => s.steps);
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const initFlow = useJourneyStore((s) => s.initFlow);
  const updateStep = useJourneyStore((s) => s.updateStep);
  const returnMirrored = useJourneyStore((s) => s.returnMirrored);
  const mirrorReturn = useJourneyStore((s) => s.mirrorReturnFromOutbound);
  const draftExpired = useJourneyStore((s) => s.draftExpired);
  const clearExpiredNotice = useJourneyStore((s) => s.clearExpiredNotice);
  const resetDraft = useJourneyStore((s) => s.reset);
  const { config } = usePricing();
  const catalog = useCatalog();
  const { capacityByCategory } = useVehicles();
  const { steps: catalogSteps } = useStepCatalog();

  // Service visibility is driven purely by price — the single admin control: a
  // step shows when it has a real price for its city (Riyadh-side steps follow
  // RUH, destination-side steps follow the chosen destination). When pricing
  // didn't load (empty fallback config) we fail open and show steps.
  const cityLoungePrices = (code: string | null | undefined) =>
    (catalog.city(code)?.airports ?? []).flatMap((a) => a.lounges.map((l) => l.price));
  const priceKnown = hasCityPricing(config);
  const flowSteps = catalogSteps.filter((def) => {
    const cityCode = def.cityScope === "RIYADH" ? "RUH" : destination;
    return priceKnown ? isStepOffered(def, cityCode, config, cityLoungePrices(cityCode)) : true;
  });

  const phases = buildPhases(t);
  // The Return phase is only part of the journey when the customer gave a return
  // date (round trip). Otherwise it's a one-way trip and Phase 3 is skipped.
  const hasReturn = !!tripInfo.returnDate;
  const activePhases = phases.filter((p) => !p.isReturn || hasReturn);

  const [stage, setStage] = useState<"start" | "phase">(
    destination && tripInfo.departureDate ? "phase" : "start",
  );
  const [phaseIdx, setPhaseIdx] = useState(0);

  // The draft persists to localStorage but is not hydrated during SSR (so the
  // server and first client render match). Rehydrate on mount, then resume.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve(useJourneyStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const { destination: d, tripInfo: ti } = useJourneyStore.getState();
    setStage(d && ti.departureDate ? "phase" : "start");
    setPhaseIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // If the persisted draft expired while away, snap back to a clean start.
  useEffect(() => {
    if (draftExpired) {
      setStage("start");
      setPhaseIdx(0);
    }
  }, [draftExpired]);

  const phase = activePhases[Math.min(phaseIdx, activePhases.length - 1)];

  // Moving between the start screen and each phase (or phase → phase) swaps the
  // content in place, so the browser keeps the previous scroll position — which
  // leaves the customer at the bottom of the new, shorter step. Reset to the top
  // on every stage / phase change so each step starts where they'd expect.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage, phaseIdx]);

  // Seed the return services from the outbound selections exactly once, the
  // first time the customer reaches the Return phase. After that the return
  // journey is independent — never auto-overwritten.
  useEffect(() => {
    if (stage === "phase" && phase?.isReturn && !returnMirrored) {
      mirrorReturn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, phase?.key, returnMirrored]);

  function startFlow() {
    initFlow(destination ?? undefined, flowSteps);
    setPhaseIdx(0);
    setStage("phase");
  }
  function startNewBooking() {
    resetDraft();
    setStage("start");
    setPhaseIdx(0);
  }
  function advance() {
    if (phaseIdx < activePhases.length - 1) setPhaseIdx(phaseIdx + 1);
    else router.push("/journey/review");
  }
  function back() {
    if (phaseIdx > 0) setPhaseIdx(phaseIdx - 1);
    else setStage("start");
  }

  const expiredBanner = draftExpired ? (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span>{pick(t.builder.draftExpired)}</span>
      <button onClick={clearExpiredNotice} className="shrink-0 text-amber-700 hover:text-amber-900" aria-label="dismiss">✕</button>
    </div>
  ) : null;

  // ─────────── Merged start: destination + trip information ───────────
  if (stage === "start") {
    return <StartStage expiredBanner={expiredBanner} onContinue={startFlow} />;
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
          <button onClick={() => setStage("start")} className="btn-gold">{pick(t.builder.chooseDestination)}</button>
        </div>
      </div>
    );
  }

  // ─────────── Phase screen ───────────
  const phaseDefs = flowSteps.filter(phase.inPhase);
  const phaseSteps = phaseDefs
    .map((def) => ({ def, step: steps.find((s) => s.stepType === def.type) }))
    .filter((x): x is { def: StepDef; step: NonNullable<typeof x.step> } => !!x.step);

  // A return-side service needs the return date/time to schedule. If it's active
  // but the return timing wasn't captured up front, collect it once here.
  const needsReturnTiming =
    phase.isReturn &&
    !hasReturnTiming(tripInfo) &&
    phaseSteps.some(({ step }) => !step.skipped);

  // Block Continue while any added service in this phase has a blocking error
  // (e.g. an assistance step with no option chosen, or a return needing timing).
  const phaseHasErrors =
    needsReturnTiming ||
    phaseSteps.some(({ step }) =>
      !step.skipped && validateStep(step, new Date(), capacityByCategory).errors.length > 0,
    );

  const progress = Math.round(((phaseIdx + 1) / activePhases.length) * 100);

  return (
    <div className="luxe-container max-w-6xl pt-8 pb-28 md:pt-12 lg:pb-12">
      {expiredBanner}
      <TripSummaryBar onChangeDestination={() => setStage("start")} onStartNew={startNewBooking} />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {/* Phase header + progress */}
          <div className="mb-4 flex items-center gap-3">
            <button onClick={back} className="btn-outline px-4 py-2 text-xs">{ar ? "→" : "←"} {pick(t.common.back)}</button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal/10">
              <div className="h-full rounded-full bg-gold-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-charcoal/50">
              {pick(t.builder.phaseLabel)} {phaseIdx + 1} {pick(t.common.of)} {activePhases.length}
            </span>
          </div>

          <div className="mb-5">
            <h1 className="font-serif text-2xl font-semibold text-charcoal md:text-3xl">{pick(phase.title)}</h1>
            <p className="mt-1 text-sm text-charcoal/60">{pick(phase.subtitle)}</p>
          </div>

          {/* Return phase — mirror notice + re-match action */}
          {phase.isReturn && !needsReturnTiming && (
            <ReturnMirrorBar onRematch={mirrorReturn} />
          )}

          {/* Return-timing prompt (fallback when it wasn't set up front) */}
          {needsReturnTiming && <ReturnTimingPrompt />}

          <div className="grid gap-4">
            {phaseSteps.map(({ def }) => (
              <PhaseServiceCard key={def.type} def={def} />
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={advance} disabled={phaseHasErrors} className="btn-gold px-8">
              {phaseIdx < activePhases.length - 1 ? pick(t.common.next) : pick(t.builder.reviewJourney)} {ar ? "←" : "→"}
            </button>
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
 * A single service inside a phase. The header always shows the service name and
 * a short brief, and can be unfolded — whether or not the step is added — so the
 * customer can preview and configure its options (vehicle, lounge, …) before
 * deciding. Adding/removing the whole step is available straight from the header.
 */
function PhaseServiceCard({ def }: { def: StepDef }) {
  const { t, pick, locale } = useI18n();
  const step = useJourneyStore((s) => s.steps.find((x) => x.stepType === def.type));
  const updateStep = useJourneyStore((s) => s.updateStep);
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const { config } = usePricing();
  const [open, setOpen] = useState(false);
  if (!step) return null;

  const on = !step.skipped && step.serviceType !== "SKIP";
  // The natural active service type. A removed/never-added step may carry
  // serviceType "SKIP", which prices to 0 and hides the car picker — so for the
  // (un-added) preview we substitute the real type, so the customer always sees
  // the true options and price before deciding.
  const activeServiceType =
    step.serviceType !== "SKIP"
      ? step.serviceType
      : def.features.assistance && !def.features.transfer
        ? "MEET_ASSIST_ONLY"
        : "CAR_ONLY";
  const viewStep = step.serviceType === "SKIP" ? { ...step, serviceType: activeServiceType } : step;
  const subtotal = computeStepPrice({ ...viewStep, skipped: false }, config).computedPrice;
  // Return-side timing may still be pending; the editor shows editable date/time
  // when the service time can't be auto-estimated.
  const isReturnStep = stepSideFromOrder(def.order) === "RETURN";
  const needsTimeInput = isReturnStep && !hasReturnTiming(tripInfo) && !step.time;

  const toggleAdd = () => {
    if (on) {
      // Off is signalled by `skipped` alone — keep the real serviceType so the
      // unfolded preview still shows the options and price (and the customer's
      // choices survive a remove → re-add).
      updateStep(def.type, { skipped: true });
    } else {
      updateStep(def.type, { skipped: false, serviceType: activeServiceType });
      setOpen(true); // reveal the options right after adding
    }
  };

  return (
    <div className={cn("luxe-card", on ? "ring-1 ring-gold/40" : "bg-ivory-warm/30")}>
      <div className="flex items-start gap-3 p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold-gradient text-sm font-bold text-charcoal">{def.order}</span>

        {/* Name + brief + unfold toggle */}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 flex-1 text-start">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-gold-dark">
            {pick(def.cityScope === "RIYADH" ? { en: "Riyadh", ar: "الرياض" } : { en: "Destination", ar: "الوجهة" })}
          </span>
          <span className="mt-0.5 block font-serif text-lg font-semibold text-charcoal">{pick(def.name)}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-charcoal/55">{pick(def.description)}</span>
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-gold-dark">
            {open ? pick(t.builder.hideOptions) : pick(t.builder.viewOptions)}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform", open && "rotate-180")}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>

        {/* Add / remove + estimated price */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={toggleAdd}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition",
              on ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "btn-gold",
            )}
          >
            {on ? `✓ ${pick(t.builder.stepIncluded)}` : `+ ${pick(t.builder.addStep)}`}
          </button>
          <span className="text-xs font-semibold text-charcoal/50">{formatPrice(subtotal, locale)}</span>
        </div>
      </div>

      {/* Unfolded options — shown whether or not the step is added */}
      {open && (
        <div className="border-t border-charcoal/5 px-5 pb-5 pt-4">
          <StepCard step={viewStep} onChange={(patch) => updateStep(def.type, patch)} needsTimeInput={needsTimeInput} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ivory-warm px-4 py-3">
            <button type="button" onClick={toggleAdd} className={cn("px-6", on ? "btn-outline" : "btn-gold")}>
              {on ? pick(t.builder.removeFromJourney) : `✓ ${pick(t.builder.addStep)}`}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-charcoal/60">{pick(t.builder.estimatedPrice)}</span>
              <span className="font-serif text-lg font-semibold text-gold-dark">{formatPrice(subtotal, locale)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Notice + explicit "re-match my outbound journey" action for the Return phase. */
function ReturnMirrorBar({ onRematch }: { onRematch: () => void }) {
  const { t, pick } = useI18n();
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gold-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-xs leading-relaxed text-charcoal/70">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8854a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M21 12a9 9 0 11-3-6.7M21 4v4h-4" /></svg>
        {pick(t.builder.returnMirroredNote)}
      </p>
      <button
        onClick={() => { if (window.confirm(pick(t.builder.matchOutboundConfirm))) onRematch(); }}
        className="btn-outline shrink-0 whitespace-nowrap px-4 py-2 text-xs"
      >
        {pick(t.builder.matchOutboundAgain)}
      </button>
    </div>
  );
}

/**
 * Collects the return journey's date & time once, when a return service is added
 * but the return timing wasn't captured in Trip Information. Writing here updates
 * Trip Information (the source of truth) and re-applies it to every step.
 */
function ReturnTimingPrompt() {
  const { t, pick } = useI18n();
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const setTripInfo = useJourneyStore((s) => s.setTripInfo);
  const applyTripInfoToSteps = useJourneyStore((s) => s.applyTripInfoToSteps);
  const update = (patch: Parameters<typeof setTripInfo>[0]) => { setTripInfo(patch); applyTripInfoToSteps(); };

  return (
    <div className="mb-5 rounded-2xl border border-gold/40 bg-gold-50/60 p-4">
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

/**
 * Merged opening screen: pick a destination and enter Trip Information on one
 * page. Trip Info is collected once and auto-filled into every later step.
 */
function StartStage({ expiredBanner, onContinue }: { expiredBanner: React.ReactNode; onContinue: () => void }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const catalog = useCatalog();
  const destination = useJourneyStore((s) => s.destination);
  const setDestination = useJourneyStore((s) => s.setDestination);
  const clearExpiredNotice = useJourneyStore((s) => s.clearExpiredNotice);
  const customer = useJourneyStore((s) => s.customer);
  const setCustomer = useJourneyStore((s) => s.setCustomer);
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const setTripInfo = useJourneyStore((s) => s.setTripInfo);

  const [attempted, setAttempted] = useState(false);

  const issues = [
    ...validateCustomer({ ...customer, language: locale }),
    ...validateTripInfo(tripInfo),
  ].filter((i) => i.severity === "error");
  const errFor = (field: string) => {
    const i = issues.find((x) => x.field === field);
    return i ? (ar ? i.messageAr : i.messageEn) : undefined;
  };
  const canContinue = !!destination && issues.length === 0;
  const FIELD_ORDER = ["fullName", "phone", "departureDate", "departureTime", "passengers", "bags", "returnDate", "email"];

  function pickDestination(code: string) {
    clearExpiredNotice();
    setDestination(code);
  }

  function cont() {
    setAttempted(true);
    if (!destination) {
      document.getElementById("start-destinations")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (issues.length > 0) {
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
      {expiredBanner}
      <div className="mb-8 text-center">
        <div className="gold-rule mx-auto mb-5" />
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.tripInfo.title)}</h1>
        <p className="mx-auto mt-3 max-w-md text-charcoal/60">{pick(t.tripInfo.subtitle)}</p>
      </div>

      {/* Destination selector */}
      <div id="start-destinations" className="mb-6">
        <span className="field-label">{pick(t.builder.chooseDestination)}</span>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {catalog.destinations.map((d) => {
            const sel = destination === d.code;
            return (
              <button
                key={d.code}
                onClick={() => pickDestination(d.code)}
                className={cn("sel-card flex items-center justify-between p-4", sel && "sel-card-on")}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl", sel ? "bg-gold-gradient text-charcoal" : "bg-charcoal text-gold-light")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" /></svg>
                  </span>
                  <div className="text-start">
                    <div className="font-serif text-base font-semibold text-charcoal">{ar ? d.nameAr : d.nameEn}</div>
                    {d.airports[0] && <div className="text-[11px] text-charcoal/50">{d.airports[0].code} · {ar ? d.airports[0].nameAr : d.airports[0].nameEn}</div>}
                  </div>
                </div>
                {sel && <span className="text-gold-dark">✓</span>}
              </button>
            );
          })}
        </div>
        {attempted && !destination && (
          <p className="mt-2 text-xs text-red-600">{ar ? "يرجى اختيار وجهة." : "Please choose a destination."}</p>
        )}
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
        <div className="flex justify-end pt-2">
          <button type="button" onClick={cont} className="btn-gold px-8">{pick(t.common.next)} {ar ? "←" : "→"}</button>
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

  // Re-resolve automatically when the trip date changes.
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

      {/* Manual time — always available when no flight is resolved. */}
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
