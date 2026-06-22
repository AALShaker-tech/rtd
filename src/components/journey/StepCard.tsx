"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  CHAUFFEUR_USAGE,
  VEHICLES,
  getStep,
  serviceHasCar,
} from "@/lib/domain";
import { usePricing } from "@/components/pricing/PricingProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { validateStep, validateVehicleCapacity } from "@/lib/validation/journey";
import { cn, composeHomeAddress, formatDateOnly } from "@/lib/utils";
import type { HomeAddressInput, JourneyStepInput } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

/** Open the native picker when clicking anywhere in a date/time input. */
function openPicker(e: React.MouseEvent<HTMLInputElement>) {
  try {
    (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
  } catch {
    /* ignore */
  }
}

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
  const ar = locale === "ar";
  const def = getStep(step.stepType);
  const f = def.features;
  const hasCar = serviceHasCar(step.serviceType);
  const result = validateStep(step);
  const errFor = (field: string) => result.errors.find((e) => e.field === field)?.[ar ? "messageAr" : "messageEn"];

  const selVeh = step.carCategory ?? "VIP";
  const capacityIssue = validateVehicleCapacity(step.carCategory, step.passengers);

  // Single source of truth for the price of any option/state. Force `skipped:false`
  // so prices are visible while the customer is still deciding (the step starts
  // un-added). The engine returns 0 for skipped steps, which we don't want here.
  const priceFor = (override: Partial<JourneyStepInput>) =>
    computeStepPrice({ ...step, skipped: false, ...override }, config).computedPrice;

  return (
    <div className="grid gap-5">
      {/* Lounge / assistance options — limited by the airport's country */}
      {f.assistance && (
        <div className="grid gap-2.5">
          <p className="text-sm font-medium text-charcoal/70">{pick(t.fields.loungeType)}</p>
          {catalog.loungeOptions(step.city).map((o) => {
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
              <input
                type="time"
                value={step.time ?? ""}
                onClick={openPicker}
                onChange={(e) => onChange({ time: e.target.value })}
                className={cn("field-input", errFor("time") && "field-input-error")}
              />
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

      {/* Locations */}
      {f.home && (
        <HomeAddressCard
          home={step.home}
          fallback={step.homeAddress}
          onChange={(home) => onChange({ home, homeAddress: composeHomeAddress(home) })}
          onManual={(homeAddress) => onChange({ homeAddress, home: undefined })}
        />
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

/** Small inline icon for an address field (decorative). */
function AddrIcon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a8854a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

/** A single labelled address input with a leading icon. */
function AddrField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  optional,
  hint,
}: {
  label: string;
  icon: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  hint?: string;
}) {
  const { t, pick } = useI18n();
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-charcoal/60">
        <AddrIcon d={icon} />
        {label}
        {optional && <span className="text-charcoal/30">· {pick(t.common.optional)}</span>}
      </span>
      <input
        value={value ?? ""}
        className="field-input"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="mt-1 block text-[11px] text-charcoal/40">{hint}</span>}
    </label>
  );
}

/**
 * Structured Saudi National Address card. Composes the entered parts into the
 * one-line `homeAddress` string that is persisted/shown to staff. Customers who
 * don't know their National Address can switch to a free-text fallback.
 */
function HomeAddressCard({
  home,
  fallback,
  onChange,
  onManual,
}: {
  home?: HomeAddressInput;
  fallback?: string;
  onChange: (home: HomeAddressInput) => void;
  onManual: (homeAddress: string) => void;
}) {
  const { t, pick } = useI18n();
  // Start in manual mode if a free-text address exists without structured parts.
  const [manual, setManual] = useState(!home && !!fallback);
  const set = (patch: Partial<HomeAddressInput>) => onChange({ ...home, ...patch });

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-ivory-warm/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-charcoal">
            <AddrIcon d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
            {pick(t.address.title)}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-charcoal/50">{pick(t.address.hint)}</p>
        </div>
        <button
          type="button"
          onClick={() => setManual((m) => !m)}
          className="shrink-0 text-[11px] font-medium text-gold-dark hover:underline"
        >
          {manual ? pick(t.address.title) : pick(t.address.manualToggle)}
        </button>
      </div>

      {manual ? (
        <label className="block">
          <span className="field-label">{pick(t.address.manualLabel)}</span>
          <textarea
            value={fallback ?? ""}
            className="field-input min-h-[80px] resize-y"
            placeholder={pick(t.address.manualHint)}
            onChange={(e) => onManual(e.target.value)}
          />
        </label>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AddrField label={pick(t.address.shortAddress)} icon="M5 12h14M12 5l7 7-7 7" value={home?.shortAddress} onChange={(v) => set({ shortAddress: v })} placeholder={pick(t.address.shortAddressHint)} hint={pick(t.address.shortAddressHint)} />
          </div>
          <AddrField label={pick(t.address.buildingNumber)} icon="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" value={home?.buildingNumber} onChange={(v) => set({ buildingNumber: v })} />
          <AddrField label={pick(t.address.street)} icon="M4 19l4-14M16 19l4-14M9 5h6M8 12h8M7 19h10" value={home?.street} onChange={(v) => set({ street: v })} />
          <AddrField label={pick(t.address.district)} icon="M12 21s-7-6.5-7-11a7 7 0 1114 0c0 4.5-7 11-7 11zM12 10a2 2 0 100-4 2 2 0 000 4z" value={home?.district} onChange={(v) => set({ district: v })} />
          <AddrField label={pick(t.address.city)} icon="M3 21V7l6-3 6 3v14M9 21v-4h2v4M3 21h18M15 21v-9l4 2v7" value={home?.city} onChange={(v) => set({ city: v })} />
          <AddrField label={pick(t.address.postalCode)} icon="M3 7h18v10H3zM3 7l9 6 9-6" value={home?.postalCode} onChange={(v) => set({ postalCode: v })} />
          <AddrField label={pick(t.address.additionalNumber)} icon="M12 5v14M5 12h14" value={home?.additionalNumber} onChange={(v) => set({ additionalNumber: v })} />
          <AddrField label={pick(t.address.unitNumber)} icon="M4 4h16v16H4zM4 12h16M12 4v16" value={home?.unitNumber} onChange={(v) => set({ unitNumber: v })} optional />
          <div className="sm:col-span-2">
            <AddrField label={pick(t.address.notes)} icon="M4 6h16M4 12h16M4 18h10" value={home?.notes} onChange={(v) => set({ notes: v })} placeholder={pick(t.address.notesHint)} optional />
          </div>
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
  const showInput = editing || !value;

  return (
    <div>
      <span className="field-label">{label}</span>
      {showInput ? (
        <input
          type="date"
          min={min}
          value={value ?? ""}
          autoFocus={editing}
          className="field-input"
          onClick={openPicker}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => value && setEditing(false)}
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
