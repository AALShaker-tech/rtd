"use client";

import { useI18n } from "@/i18n/I18nProvider";
import {
  LOUNGE_TYPES,
  VEHICLES,
  getStep,
  getVehicle,
  serviceHasCar,
} from "@/lib/domain";
import { usePricing } from "@/components/pricing/PricingProvider";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { validateStep, validateVehicleCapacity } from "@/lib/validation/journey";
import { FlightLookup } from "./FlightLookup";
import type { JourneyStepInput } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Editor for a single journey step. Every displayed price is derived from the
 * SAME `computeStepPrice` engine used for the running total and the server,
 * so the price shown is always exactly the price added/saved.
 */
export function StepCard({
  step,
  onChange,
}: {
  step: JourneyStepInput;
  onChange: (patch: Partial<JourneyStepInput>) => void;
}) {
  const { t, pick, locale } = useI18n();
  const { config } = usePricing();
  const ar = locale === "ar";
  const def = getStep(step.stepType);
  const f = def.features;
  const hasCar = serviceHasCar(step.serviceType);
  const result = validateStep(step);
  const errFor = (field: string) => result.errors.find((e) => e.field === field)?.[ar ? "messageAr" : "messageEn"];

  const selVeh = step.carCategory ?? "VIP";
  const capacity = step.carCategory ? getVehicle(step.carCategory).maxPassengers : Infinity;
  const capacityIssue = validateVehicleCapacity(step.carCategory, step.passengers);

  // Single source of truth for the price of any option/state. Force `skipped:false`
  // so prices are visible while the customer is still deciding (the step starts
  // un-added). The engine returns 0 for skipped steps, which we don't want here.
  const priceFor = (override: Partial<JourneyStepInput>) =>
    computeStepPrice({ ...step, skipped: false, ...override }, config).computedPrice;

  function changePassengers(next: number) {
    // Enforce capacity while changing — never allow exceeding the selected vehicle.
    if (step.carCategory && next > capacity) return; // blocked; message shown below
    onChange({ passengers: Math.max(1, next) });
  }

  return (
    <div className="grid gap-5">
      {/* Flight lookup */}
      {f.flight && <FlightLookup step={step} onChange={onChange} />}

      {/* Lounge / assistance options */}
      {f.assistance && (
        <div className="grid gap-2.5">
          <p className="text-sm font-medium text-charcoal/70">{pick(t.fields.loungeType)}</p>
          {LOUNGE_TYPES.map((o) => {
            const on = step.loungeType === o.value;
            return (
              <button key={o.value} onClick={() => onChange({ loungeType: o.value })} className={`sel-card flex items-center justify-between ${on ? "sel-card-on" : ""}`}>
                <span className="font-medium text-charcoal">{pick(o.name)}</span>
                <span className={`text-sm font-semibold ${on ? "text-gold-dark" : "text-charcoal/50"}`}>{formatPrice(priceFor({ loungeType: o.value }), locale)}</span>
              </button>
            );
          })}
          <p className="text-center text-xs text-charcoal/40">{pick(t.builder.loungeHint)}</p>
        </div>
      )}

      {/* Vehicle picker */}
      {((f.transfer && hasCar) || f.chauffeur) && (
        <div className="grid gap-2.5">
          <p className="text-sm font-medium text-charcoal/70">{pick(t.builder.chooseCar)}</p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {VEHICLES.map((v) => {
              const sel = selVeh === v.category;
              const unit = priceFor({ carCategory: v.category, days: f.chauffeur ? 1 : step.days });
              return (
                <button key={v.category} onClick={() => onChange({ carCategory: v.category })} className={`sel-card ${sel ? "sel-card-on" : ""}`}>
                  <span className="block font-semibold text-charcoal">{pick(v.name)}</span>
                  <span className="block text-[0.7rem] text-charcoal/50">{v.exampleModels}</span>
                  <span className="mt-1 block text-[0.7rem] text-charcoal/40">{ar ? `حتى ${v.maxPassengers} ركاب` : `Up to ${v.maxPassengers}`}</span>
                  <span className={`mt-2 block text-sm font-semibold ${sel ? "text-gold-dark" : "text-charcoal/60"}`}>
                    {formatPrice(unit, locale)}{f.chauffeur ? ` ${pick(t.builder.perDay)}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chauffeur days + dates */}
      {f.chauffeur ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Stepper label={pick(t.fields.days)} value={step.days ?? 1} min={1} onChange={(v) => onChange({ days: v })} />
          <div />
          <Field label={pick(t.fields.startDate)} error={errFor("date")}>
            <input type="date" min={today()} value={step.date ?? ""} className="field-input" onChange={(e) => onChange({ date: e.target.value })} />
          </Field>
          <Field label={pick(t.fields.endDate)} error={errFor("endDate")}>
            <input type="date" min={step.date ?? today()} value={step.endDate ?? ""} className="field-input" onChange={(e) => onChange({ endDate: e.target.value })} />
          </Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={pick(t.fields.date)} error={errFor("date")}>
            <input type="date" min={today()} value={step.date ?? ""} className="field-input" onChange={(e) => onChange({ date: e.target.value })} />
          </Field>
          <Field label={pick(t.fields.time)} error={errFor("time")}>
            <input type="time" value={step.time ?? ""} className="field-input" onChange={(e) => onChange({ time: e.target.value })} />
          </Field>
        </div>
      )}

      {/* Locations */}
      {f.home && (
        <Field label={pick(t.fields.homeAddress)}>
          <input value={step.homeAddress ?? ""} className="field-input" placeholder={ar ? "حي العليا، الرياض" : "Al Olaya, Riyadh"} onChange={(e) => onChange({ homeAddress: e.target.value })} />
        </Field>
      )}
      {f.hotel && (
        <Field label={pick(t.fields.hotelName)}>
          <input value={step.hotelName ?? ""} className="field-input" placeholder={ar ? "اسم الفندق" : "Hotel name"} onChange={(e) => onChange({ hotelName: e.target.value })} />
        </Field>
      )}

      {/* Passengers + bags (capacity-enforced) */}
      {f.transfer && hasCar && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Stepper label={pick(t.fields.passengers)} value={step.passengers ?? 1} min={1} max={capacity} onChange={changePassengers} />
          <Stepper label={pick(t.fields.bags)} value={step.bags ?? 0} min={0} onChange={(v) => onChange({ bags: v })} />
        </div>
      )}

      {/* Capacity message (bilingual, with suggestion) */}
      {capacityIssue && (
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
          {ar ? capacityIssue.messageAr : capacityIssue.messageEn}
        </p>
      )}

      {/* Other validation */}
      {(result.errors.filter((e) => e.field !== "passengers").length > 0 || result.warnings.length > 0) && (
        <div className="grid gap-1.5">
          {[...result.errors.filter((e) => e.field !== "passengers"), ...result.warnings].map((iss, i) => (
            <p key={i} className={`rounded-xl px-3 py-2 text-xs ${iss.severity === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
              {ar ? iss.messageAr : iss.messageEn}
            </p>
          ))}
        </div>
      )}
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

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max?: number; onChange: (v: number) => void }) {
  const atMax = max != null && value >= max;
  return (
    <div className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-white px-4 py-2.5 shadow-sm">
      <span className="text-sm text-charcoal/70">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="stepper-btn">−</button>
        <span className="min-w-5 text-center text-lg font-semibold text-charcoal">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} disabled={atMax} className="stepper-btn">+</button>
      </div>
    </div>
  );
}
