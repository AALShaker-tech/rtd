"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  CHAUFFEUR_USAGE,
  getStep,
  serviceHasCar,
} from "@/lib/domain";
import { usePricing } from "@/components/pricing/PricingProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { useVehicles } from "@/components/vehicles/VehicleProvider";
import { vehicleName, defaultVehicleCategory } from "@/lib/vehicles";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { hasCityPricing, pricedVehicleClasses } from "@/lib/availability";
import { validateStep, validateVehicleCapacity, totalVehicleCapacity } from "@/lib/validation/journey";
import { cn, formatDateOnly } from "@/lib/utils";
import { DateField, TimeField } from "@/components/ui/DateTimeField";
import type { CarCategory } from "@/lib/domain";
import type { JourneyStepInput } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

/** Business rule: end date = start date + number of days, formatted yyyy-mm-dd. */
function chauffeurEndDate(start: string, days: number): string {
  const d = new Date(`${start}T00:00:00`);
  if (Number.isNaN(d.getTime())) return start;
  d.setDate(d.getDate() + Math.max(1, days));
  return d.toISOString().slice(0, 10);
}

/**
 * Editor for a single journey step. Every displayed price is derived from the
 * SAME `computeStepPrice` engine used for the running total and the server,
 * so the price shown is always exactly the price added/saved.
 */
export function StepCard({
  step,
  onChange,
  needsTimeInput = false,
}: {
  step: JourneyStepInput;
  onChange: (patch: Partial<JourneyStepInput>) => void;
  /** True when the time can't be auto-estimated (e.g. return/arrival with no
   *  flight) — show editable date/time instead of a read-only suggestion. */
  needsTimeInput?: boolean;
}) {
  const { t, pick, locale } = useI18n();
  const { config } = usePricing();
  const catalog = useCatalog();
  const { vehicles, capacityByCategory } = useVehicles();
  const ar = locale === "ar";
  const def = step.def ?? getStep(step.stepType);
  const f = def?.features ?? { transfer: false, assistance: false, flight: false, hotel: false, home: false, chauffeur: false };
  const hasCar = serviceHasCar(step.serviceType);
  const result = validateStep(step, new Date(), capacityByCategory);
  const errFor = (field: string) => result.errors.find((e) => e.field === field)?.[ar ? "messageAr" : "messageEn"];

  // Only the vehicle classes offered in this step's city: not disabled by the
  // admin (per-city toggle) and carrying a real (> 0) price for this service.
  // When pricing didn't load (empty fallback config) show all classes rather
  // than none, so the picker never renders empty.
  const priceKnown = hasCityPricing(config);
  const disabledForCity = new Set(catalog.city(step.city)?.disabledVehicles ?? []);
  const priced = new Set(pricedVehicleClasses(config, step.city, step.stepType));
  const cityVehicles = vehicles.filter((v) => !disabledForCity.has(v.category) && (!priceKnown || priced.has(v.category)));
  const selVeh = step.carCategory ?? defaultVehicleCategory(cityVehicles);
  // Transfer steps get the full multi-vehicle capacity panel below (which
  // accounts for any added vehicles); only the chauffeur — always a single car —
  // uses this inline single-vehicle capacity message.
  const capacityIssue = f.chauffeur
    ? validateVehicleCapacity(
        step.carCategory,
        step.passengers,
        step.carCategory ? capacityByCategory[step.carCategory] : undefined,
      )
    : null;

  // Single source of truth for the price of any option/state. Force `skipped:false`
  // so prices are visible while the customer is still deciding (the step starts
  // un-added). The engine returns 0 for skipped steps, which we don't want here.
  const priceFor = (override: Partial<JourneyStepInput>) =>
    computeStepPrice({ ...step, skipped: false, ...override }, config).computedPrice;

  return (
    <div className="grid gap-5">
      {/* Lounge / assistance options — the lounges enabled at the chosen airport */}
      {f.assistance && (() => {
        const cityAirports = catalog.city(step.city)?.airports ?? [];
        // Use the selected airport, or auto-use the only one the city has.
        const activeAirport = step.airport ?? (cityAirports.length === 1 ? cityAirports[0].code : undefined);
        // Only lounges that carry a real price — a 0-priced option is never
        // offered (unless pricing didn't load, in which case show what we have).
        const airportLounges = (activeAirport ? catalog.airportLounges(activeAirport) : []).filter((l) => !priceKnown || l.price > 0);
        return (
          <div className="grid gap-2.5">
            <p className="text-sm font-medium text-charcoal/70">{pick(t.fields.loungeType)}</p>

            {/* Airport picker when the city has more than one airport. */}
            {cityAirports.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {cityAirports.map((a) => {
                  const on = activeAirport === a.code;
                  return (
                    <button
                      key={a.code}
                      onClick={() => onChange({ airport: a.code, loungeType: undefined })}
                      className={`badge border px-3 py-1.5 ${on ? "border-gold bg-gold-50 text-gold-dark" : "border-charcoal/15 text-charcoal/60 hover:border-gold/40"}`}
                    >
                      {a.code} · {ar ? a.nameAr : a.nameEn}
                    </button>
                  );
                })}
              </div>
            )}

            {!activeAirport ? (
              <p className="text-center text-xs text-charcoal/45">{ar ? "اختر المطار لعرض الصالات." : "Select the airport to see its lounges."}</p>
            ) : airportLounges.length === 0 ? (
              <p className="text-center text-xs text-charcoal/45">{ar ? "لا توجد صالات متاحة في هذا المطار." : "No lounges available at this airport."}</p>
            ) : (
              airportLounges.map((o) => {
                const on = step.loungeType === o.id;
                const desc = ar ? o.descriptionAr : o.descriptionEn;
                return (
                  <button key={o.id} onClick={() => onChange({ loungeType: o.id, airport: activeAirport })} className={`sel-card flex items-start justify-between gap-3 ${on ? "sel-card-on" : ""}`}>
                    <span className="min-w-0">
                      <span className="block font-medium text-charcoal">{ar ? o.nameAr : o.nameEn}</span>
                      {desc && <span className="mt-0.5 block text-xs leading-relaxed text-charcoal/50">{desc}</span>}
                    </span>
                    <span className={`shrink-0 text-sm font-semibold ${on ? "text-gold-dark" : "text-charcoal/50"}`}>{formatPrice(priceFor({ loungeType: o.id, airport: activeAirport }), locale)}</span>
                  </button>
                );
              })
            )}
            <p className="text-center text-xs text-charcoal/40">{pick(t.builder.loungeHint)}</p>
          </div>
        );
      })()}

      {/* Vehicle picker */}
      {((f.transfer && hasCar) || f.chauffeur) && (
        <div className="grid gap-2.5">
          <p className="text-sm font-medium text-charcoal/70">{pick(t.builder.chooseCar)}</p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {cityVehicles.map((v) => {
              const sel = selVeh === v.category;
              // Show the per-class price for the PRIMARY vehicle alone — never
              // fold in any added vehicles (those are priced separately below).
              const unit = priceFor({ carCategory: v.category as typeof step.carCategory, additionalVehicles: [], days: f.chauffeur ? 1 : step.days });
              return (
                <button key={v.category} onClick={() => onChange({ carCategory: v.category as typeof step.carCategory })} className={`sel-card ${sel ? "sel-card-on" : ""}`}>
                  <span className="block font-semibold text-charcoal">{vehicleName(v, locale)}</span>
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

      {/* Additional vehicles — for transfers, when one car can't carry the whole
          party. The customer keeps their chosen vehicle and adds others of ANY
          class; we never silently switch their selection. */}
      {f.transfer && hasCar && (() => {
        const extras = step.additionalVehicles ?? [];
        const totalCap = totalVehicleCapacity(step.carCategory, extras, capacityByCategory);
        const pax = step.passengers ?? 0;
        const short = totalCap != null && pax > totalCap;
        // A helpful default for a newly added vehicle: the largest offered class.
        const biggest = [...cityVehicles].sort(
          (a, b) => (capacityByCategory[b.category] ?? 0) - (capacityByCategory[a.category] ?? 0),
        )[0];
        const addVehicle = () =>
          onChange({ additionalVehicles: [...extras, { carCategory: (biggest?.category ?? selVeh) as CarCategory }] });
        const removeVehicle = (i: number) =>
          onChange({ additionalVehicles: extras.filter((_, idx) => idx !== i) });
        const setVehicleCat = (i: number, cat: CarCategory) =>
          onChange({ additionalVehicles: extras.map((v, idx) => (idx === i ? { ...v, carCategory: cat } : v)) });

        return (
          <div className="grid gap-3 rounded-2xl border border-charcoal/10 bg-ivory-warm/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-charcoal/70">{pick(t.builder.additionalVehicles)}</p>
              {totalCap != null && (
                <span className={cn(
                  "badge",
                  short ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
                )}>
                  {pick(t.builder.totalCapacity)}: {totalCap} {pick(t.builder.vehicleSeats)}
                </span>
              )}
            </div>

            {short && (
              <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
                {pick(t.builder.capacityShortfall)}
              </p>
            )}

            {extras.map((v, i) => (
              <div key={i} className="rounded-xl border border-charcoal/10 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-charcoal/60">#{i + 2}</span>
                  <button type="button" onClick={() => removeVehicle(i)} className="text-xs font-medium text-red-600 hover:underline">
                    {pick(t.builder.removeVehicle)}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {cityVehicles.map((cv) => {
                    const sel = v.carCategory === cv.category;
                    return (
                      <button
                        key={cv.category}
                        type="button"
                        onClick={() => setVehicleCat(i, cv.category as CarCategory)}
                        className={cn("sel-card text-center", sel && "sel-card-on")}
                      >
                        <span className="block font-semibold text-charcoal">{vehicleName(cv, locale)}</span>
                        <span className="block text-[0.7rem] text-charcoal/40">{ar ? `حتى ${cv.maxPassengers}` : `Up to ${cv.maxPassengers}`}</span>
                        <span className={cn("mt-1 block text-sm font-semibold", sel ? "text-gold-dark" : "text-charcoal/60")}>
                          {formatPrice(priceFor({ carCategory: cv.category as typeof step.carCategory, additionalVehicles: [] }), locale)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button type="button" onClick={addVehicle} className="btn-outline w-full py-2 text-xs">
              + {pick(t.builder.addVehicle)}
            </button>
          </div>
        );
      })()}

      {/* Chauffeur — start date + number of days + daily usage (end date auto) */}
      {f.chauffeur && (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <PrefilledDate label={pick(t.fields.startDate)} value={step.date} min={today()} onChange={(v) => onChange({ date: v })} error={errFor("date")} />
            <Stepper label={pick(t.fields.days)} value={step.days ?? 1} min={1} onChange={(v) => onChange({ days: v })} />
          </div>
          <div>
            <p className="field-label">{pick(t.fields.dailyUsage)}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {CHAUFFEUR_USAGE.map((u) => {
                const sel = (step.dailyUsage ?? "EIGHT_HOURS") === u.value;
                return (
                  <button key={u.value} type="button" onClick={() => onChange({ dailyUsage: u.value })} className={`sel-card text-center ${sel ? "sel-card-on" : ""}`}>
                    <span className="font-semibold text-charcoal">{pick(u.name)}</span>
                  </button>
                );
              })}
            </div>
            {errFor("dailyUsage") && <p className="mt-1 text-xs text-red-600">{errFor("dailyUsage")}</p>}
          </div>
          {step.date && step.days ? (
            <p className="rounded-xl bg-ivory-warm px-4 py-2.5 text-xs text-charcoal/60">
              {pick(t.fields.endDate)}: <span className="font-medium text-charcoal">{chauffeurEndDate(step.date, step.days)}</span>
            </p>
          ) : null}
        </div>
      )}

      {/* Time: auto-estimated → read-only suggestion; otherwise (return steps with
          no return info, or arrival with no flight) → editable date/time fields. */}
      {!f.chauffeur && (
        needsTimeInput ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <PrefilledDate label={pick(t.fields.date)} value={step.date} min={today()} onChange={(v) => onChange({ date: v })} error={errFor("date")} />
            <Field label={pick(t.fields.time)} error={errFor("time")}>
              <TimeField value={step.time} onChange={(v) => onChange({ time: v })} error={!!errFor("time")} />
            </Field>
          </div>
        ) : step.time ? (
          <p className="rounded-xl bg-gold-50 px-4 py-2.5 text-xs text-gold-dark">
            {pick(t.tripInfo.suggestedTime)}: <span className="font-semibold">{step.time}</span>
            {step.date ? ` · ${formatDateOnly(step.date, locale)}` : ""}
            {step.stepType === "ARRIVAL_ASSIST_DESTINATION" || step.stepType === "AIRPORT_TO_HOTEL" ? ` — ${pick(t.tripInfo.arrivalDateNote)}` : ""}
          </p>
        ) : null
      )}

      {/* Locations — single home address field with a National Address info hint */}
      {f.home && (
        <label className="block">
          <span className="field-label flex items-center gap-1.5">
            {pick(t.address.label)}
            <AddressInfo text={pick(t.address.info)} />
          </span>
          <input
            value={step.homeAddress ?? ""}
            className="field-input"
            placeholder={pick(t.address.placeholder)}
            onChange={(e) => onChange({ homeAddress: e.target.value })}
          />
        </label>
      )}
      {f.hotel && (
        <Field label={pick(t.fields.hotelName)}>
          <input value={step.hotelName ?? ""} className="field-input" placeholder={ar ? "اسم الفندق" : "Hotel name"} onChange={(e) => onChange({ hotelName: e.target.value })} />
        </Field>
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

/** Small "i" info chip explaining the Saudi National Address (hover / tap). */
function AddressInfo({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="info"
        className="grid h-4 w-4 place-items-center rounded-full border border-charcoal/30 text-[10px] font-bold text-charcoal/50 transition hover:border-gold hover:text-gold-dark"
      >
        i
      </button>
      {open && (
        <span className="absolute top-6 z-20 w-60 rounded-xl border border-charcoal/10 bg-white p-3 text-[11px] font-normal leading-relaxed text-charcoal/70 shadow-luxe ltr:left-0 rtl:right-0">
          {text}
        </span>
      )}
    </span>
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

/**
 * A date that is pre-filled from Trip Information. Shows the value as a fixed,
 * elegant read-only field with a small "Edit" toggle so the customer isn't asked
 * to re-enter it. Falls back to a plain date input when no value is set.
 */
function PrefilledDate({
  label,
  value,
  min,
  onChange,
  error,
  note,
}: {
  label: string;
  value?: string;
  min?: string;
  onChange: (v: string) => void;
  error?: string;
  note?: string;
}) {
  const { t, pick, locale } = useI18n();
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <span className="field-label">{label}</span>
      {editing || !value ? (
        <DateField
          value={value}
          min={min}
          autoOpen={editing}
          error={!!error}
          onChange={(v) => { onChange(v); setEditing(false); }}
        />
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-ivory-warm px-4 py-2.5">
          <span className="text-sm font-medium text-charcoal">{formatDateOnly(value, locale)}</span>
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-gold-dark hover:underline">
            {pick(t.common.edit)}
          </button>
        </div>
      )}
      {note && !error && <p className="mt-1 text-[11px] text-charcoal/45">{note}</p>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </div>
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
