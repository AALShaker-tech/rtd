"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { CITIES, getCity } from "@/lib/domain";
import { ALL_STEPS, useJourneyStore } from "@/store/journeyStore";
import { usePricing } from "@/components/pricing/PricingProvider";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { validateCustomer, validateStep, validateTripInfo } from "@/lib/validation/journey";
import { COUNTRY_CODES, isValidEmail, parsePhone } from "@/lib/phone";
import { StepCard } from "@/components/journey/StepCard";
import { JourneySummary } from "@/components/journey/JourneySummary";
import { TripSummaryBar } from "@/components/journey/TripSummaryBar";

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
  const { config } = usePricing();

  const [stage, setStage] = useState<"destination" | "tripinfo" | "flow">(
    destination ? (tripInfo.departureDate ? "flow" : "tripinfo") : "destination",
  );
  const [idx, setIdx] = useState(0);

  function pickDestination(code: string) {
    setDestination(code);
    setStage("tripinfo");
  }
  function startFlow() {
    initFlow();
    setIdx(0);
    setStage("flow");
  }
  function advance() {
    if (idx < ALL_STEPS.length - 1) setIdx(idx + 1);
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

  // ─────────── Trip Information ───────────
  if (stage === "tripinfo") {
    return <TripInfoStage onBack={() => setStage("destination")} onContinue={startFlow} />;
  }

  // ─────────── Step-by-step flow ───────────
  const def = ALL_STEPS[idx];
  const step = steps.find((s) => s.stepType === def.type);
  const progress = Math.round((idx / ALL_STEPS.length) * 100);
  if (!step) return null;

  const subtotal = computeStepPrice({ ...step, skipped: false }, config).computedPrice;
  const stepValidation = validateStep({ ...step, skipped: false });
  const blockAdd = stepValidation.errors.some((e) => e.field === "passengers");

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

      {/* Trip summary (pre-filled from Trip Information; editable) */}
      <TripSummaryBar />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <button onClick={back} className="btn-outline px-4 py-2 text-xs">{ar ? "→" : "←"} {pick(t.common.back)}</button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal/10">
              <div className="h-full rounded-full bg-gold-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-charcoal/50">{pick(t.common.step)} {idx + 1} {pick(t.common.of)} {ALL_STEPS.length}</span>
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

            <div className="mt-6">
              <StepCard step={step} onChange={(patch) => updateStep(def.type, patch)} />
            </div>

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

/** Trip Information — collected once at the start, auto-filled into later steps. */
function TripInfoStage({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const customer = useJourneyStore((s) => s.customer);
  const setCustomer = useJourneyStore((s) => s.setCustomer);
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const setTripInfo = useJourneyStore((s) => s.setTripInfo);

  const [touched, setTouched] = useState(false);

  const phoneCheck = parsePhone(customer.phone || "", customer.phoneCountry || "SA");
  const emailOk = !customer.email || isValidEmail(customer.email);
  const customerErrors = validateCustomer({ ...customer, language: locale });
  const tripErrors = validateTripInfo(tripInfo).filter((e) => e.severity === "error");
  const canContinue = customerErrors.filter((e) => e.severity === "error").length === 0 && tripErrors.length === 0;

  function cont() {
    setTouched(true);
    if (!canContinue) return;
    setCustomer({ language: locale });
    onContinue();
  }

  return (
    <div className="luxe-container max-w-2xl py-10 md:py-14">
      <div className="mb-8 text-center">
        <div className="gold-rule mx-auto mb-5" />
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.tripInfo.title)}</h1>
        <p className="mx-auto mt-3 max-w-md text-charcoal/60">{pick(t.tripInfo.subtitle)}</p>
      </div>

      <div className="luxe-card space-y-5 p-6 md:p-8">
        <Field label={pick(t.fields.fullName)} error={touched && !customer.fullName ? pick(t.common.required) : undefined}>
          <input className="field-input" value={customer.fullName} onChange={(e) => setCustomer({ fullName: e.target.value })} placeholder={ar ? "الاسم الكامل" : "Your full name"} />
        </Field>

        <div>
          <span className="field-label">{pick(t.fields.phone)}</span>
          <div className="flex gap-2">
            <select className="field-input w-32 shrink-0" value={customer.phoneCountry} onChange={(e) => setCustomer({ phoneCountry: e.target.value })}>
              {COUNTRY_CODES.map((c) => (<option key={c.code} value={c.code}>{c.dial} {c.code}</option>))}
            </select>
            <input className="field-input flex-1" inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ phone: e.target.value })} placeholder="5XXXXXXXX" />
          </div>
          {touched && !phoneCheck.valid && <p className="mt-1 text-xs text-red-600">{ar ? "رقم جوال غير صحيح" : "Invalid mobile number"}</p>}
        </div>

        <Field label={`${pick(t.fields.email)} — ${pick(t.common.optional)}`} error={touched && !emailOk ? (ar ? "بريد غير صحيح" : "Invalid email") : undefined}>
          <input className="field-input" inputMode="email" value={customer.email} onChange={(e) => setCustomer({ email: e.target.value })} placeholder="name@example.com" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={pick(t.tripInfo.departureDate)} error={touched && !tripInfo.departureDate ? pick(t.common.required) : undefined}>
            <input type="date" min={today()} className="field-input" value={tripInfo.departureDate} onChange={(e) => setTripInfo({ departureDate: e.target.value })} />
          </Field>
          <Field
            label={pick(t.tripInfo.returnDate)}
            error={touched && tripInfo.returnDate && tripInfo.departureDate && tripInfo.returnDate < tripInfo.departureDate ? (ar ? "قبل المغادرة" : "Before departure") : undefined}
          >
            <input type="date" min={tripInfo.departureDate || today()} className="field-input" value={tripInfo.returnDate} onChange={(e) => setTripInfo({ returnDate: e.target.value })} />
          </Field>
        </div>

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

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <button onClick={onBack} className="btn-ghost">{ar ? "→" : "←"} {pick(t.common.back)}</button>
          <button onClick={cont} disabled={touched && !canContinue} className="btn-gold">{pick(t.common.next)} {ar ? "←" : "→"}</button>
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
