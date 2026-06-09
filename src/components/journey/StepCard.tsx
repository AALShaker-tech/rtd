"use client";

import { useI18n } from "@/i18n/I18nProvider";
import {
  LOUNGE_TYPES,
  VEHICLES,
  getCity,
  getStep,
  serviceHasCar,
  type StepType,
} from "@/lib/domain";
import { usePricing } from "@/components/pricing/PricingProvider";
import { formatPrice } from "@/lib/pricing";
import { validateStep } from "@/lib/validation/journey";
import { FlightLookup } from "./FlightLookup";
import type { JourneyStepInput } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

/** Dark, compact editor for a single journey step (SAFAR-style). */
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
  const errFor = (field: string) =>
    result.errors.find((e) => e.field === field)?.[ar ? "messageAr" : "messageEn"];

  const selVeh = step.carCategory ?? "VIP";

  return (
    <div className="grid gap-4">
      {/* Flight lookup */}
      {f.flight && <FlightLookup step={step} onChange={onChange} />}

      {/* Lounge / assistance options */}
      {f.assistance && (
        <div className="grid gap-2.5">
          <div className="text-[13px] text-dim">{pick(t.fields.loungeType)}</div>
          {LOUNGE_TYPES.map((o) => {
            const on = step.loungeType === o.value;
            const price = config.lounges[o.value];
            return (
              <button
                key={o.value}
                onClick={() => onChange({ loungeType: o.value })}
                className={`dcard-soft p-3.5 text-start ${on ? "dcard-selected" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="disp text-[15px] font-semibold text-cream">{pick(o.name)}</span>
                  {price != null && <span className="text-[13.5px] font-semibold text-gold">{formatPrice(price, locale)}</span>}
                </div>
              </button>
            );
          })}
          <p className="text-center text-[12px] text-dim">{pick(t.builder.loungeHint)}</p>
        </div>
      )}

      {/* Vehicle picker */}
      {((f.transfer && hasCar) || f.chauffeur) && (
        <div className="grid gap-2">
          <div className="text-[13px] text-dim">{pick(t.builder.chooseCar)}</div>
          {VEHICLES.map((v) => {
            const sel = selVeh === v.category;
            const base = config.services[step.stepType] ?? 0;
            const factor = step.city ? config.destinationFactors[step.city] ?? 1 : 1;
            const unit = Math.round(base * v.multiplier * factor);
            return (
              <button
                key={v.category}
                onClick={() => onChange({ carCategory: v.category })}
                className={`dcard-soft p-3.5 text-start ${sel ? "dcard-selected" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="disp text-[15px] font-semibold text-cream">{pick(v.name)}</span>
                    <span className="ms-2 text-[11px] text-dim">{v.maxPassengers} {pick(t.fields.passengers)}</span>
                    <div className="text-[12px] text-dim">{v.exampleModels}</div>
                  </div>
                  <span className={`text-[13.5px] font-semibold ${sel ? "text-gold" : "text-dim"}`}>
                    {formatPrice(unit, locale)}{f.chauffeur ? ` ${pick(t.builder.perDay)}` : ""}
                  </span>
                </div>
              </button>
            );
          })}
          {errFor("passengers") && <p className="text-[12.5px] text-red-400">{errFor("passengers")}</p>}
        </div>
      )}

      {/* Chauffeur days + dates */}
      {f.chauffeur ? (
        <div className="grid gap-3">
          <Stepper label={pick(t.fields.days)} value={step.days ?? 1} min={1} onChange={(v) => onChange({ days: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={pick(t.fields.startDate)} error={errFor("date")}>
              <input type="date" min={today()} value={step.date ?? ""} className="dinput" onChange={(e) => onChange({ date: e.target.value })} />
            </Field>
            <Field label={pick(t.fields.endDate)} error={errFor("endDate")}>
              <input type="date" min={step.date ?? today()} value={step.endDate ?? ""} className="dinput" onChange={(e) => onChange({ endDate: e.target.value })} />
            </Field>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label={pick(t.fields.date)} error={errFor("date")}>
            <input type="date" min={today()} value={step.date ?? ""} className="dinput" onChange={(e) => onChange({ date: e.target.value })} />
          </Field>
          <Field label={pick(t.fields.time)} error={errFor("time")}>
            <input type="time" value={step.time ?? ""} className="dinput" onChange={(e) => onChange({ time: e.target.value })} />
          </Field>
        </div>
      )}

      {/* Locations */}
      {f.home && (
        <Field label={pick(t.fields.homeAddress)}>
          <input value={step.homeAddress ?? ""} className="dinput" placeholder={ar ? "حي العليا، الرياض" : "Al Olaya, Riyadh"} onChange={(e) => onChange({ homeAddress: e.target.value })} />
        </Field>
      )}
      {f.hotel && (
        <Field label={pick(t.fields.hotelName)}>
          <input value={step.hotelName ?? ""} className="dinput" placeholder={ar ? "اسم الفندق" : "Hotel name"} onChange={(e) => onChange({ hotelName: e.target.value })} />
        </Field>
      )}

      {/* Passengers + bags */}
      {f.transfer && hasCar && (
        <div className="grid grid-cols-2 gap-3">
          <Stepper label={pick(t.fields.passengers)} value={step.passengers ?? 1} min={1} onChange={(v) => onChange({ passengers: v })} />
          <Stepper label={pick(t.fields.bags)} value={step.bags ?? 0} min={0} onChange={(v) => onChange({ bags: v })} />
        </div>
      )}

      {(result.errors.length > 0 || result.warnings.length > 0) && (
        <div className="grid gap-1.5">
          {[...result.errors, ...result.warnings].map((iss, i) => (
            <p
              key={i}
              className="rounded-lg px-3 py-2 text-[12.5px]"
              style={{
                background: iss.severity === "error" ? "rgba(211,112,95,.10)" : "rgba(217,164,65,.10)",
                color: iss.severity === "error" ? "#e69384" : "#d9a441",
              }}
            >
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
      <span className="mb-1.5 block text-[13px] text-dim">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-red-400">{error}</span>}
    </label>
  );
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border gold-line px-3.5 py-2.5" style={{ background: "rgba(255,255,255,.03)" }}>
      <span className="text-[13.5px] text-cream">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg border gold-line text-gold">−</button>
        <span className="disp min-w-5 text-center text-[17px] font-semibold text-cream">{value}</span>
        <button onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-lg border gold-line text-gold">+</button>
      </div>
    </div>
  );
}
