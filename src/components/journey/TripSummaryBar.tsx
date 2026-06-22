"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useJourneyStore } from "@/store/journeyStore";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { resolveFlightAction } from "@/server/actions/flight.actions";
import { formatDateOnly } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

/** Small "i" with an accessible popover explaining the auto-filled values. */
function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label="info"
        className="grid h-4 w-4 place-items-center rounded-full border border-charcoal/30 text-[10px] font-bold text-charcoal/50 transition hover:border-gold hover:text-gold-dark"
      >
        i
      </button>
      {open && (
        <span className="absolute top-6 z-20 w-60 rounded-xl border border-charcoal/10 bg-white p-3 text-[11px] leading-relaxed text-charcoal/70 shadow-luxe ltr:left-0 rtl:right-0">
          {text}
        </span>
      )}
    </span>
  );
}

/**
 * Single, compact "trip summary" card shown at the top of every service step.
 * Merges the route bar + auto-filled trip info + info tooltip + actions
 * (Edit Trip Information, Change destination, Start New). Values come from the
 * Trip Information step (the source of truth); Edit updates them everywhere.
 */
export function TripSummaryBar({
  onChangeDestination,
  onStartNew,
}: {
  onChangeDestination?: () => void;
  onStartNew?: () => void;
}) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const destination = useJourneyStore((s) => s.destination);
  const catalog = useCatalog();
  const [open, setOpen] = useState(false);

  const chips: string[] = [
    `${pick(t.tripInfo.departureDate)}: ${tripInfo.departureDate ? formatDateOnly(tripInfo.departureDate, locale) : "—"}`,
    ...(tripInfo.returnDate ? [`${pick(t.tripInfo.returnDate)}: ${formatDateOnly(tripInfo.returnDate, locale)}`] : []),
    `${tripInfo.passengers} ${pick(t.fields.passengers)}`,
    `${tripInfo.bags} ${pick(t.fields.bags)}`,
    ...(tripInfo.specialAssistance ? [pick(t.tripInfo.specialAssistanceLabel)] : []),
  ];

  return (
    <>
      <div className="mb-5 rounded-2xl border border-charcoal/10 bg-white px-4 py-3 shadow-sm">
        {/* Row 1 — route + actions */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-charcoal">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a8854a" strokeWidth="2"><path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" /></svg>
            {ar ? "الرياض" : "Riyadh"} ✈ {catalog.cityName(destination, locale)} ✈ {ar ? "الرياض" : "Riyadh"}
          </span>
          <div className="flex items-center gap-3">
            {onChangeDestination && (
              <button onClick={onChangeDestination} className="text-sm font-medium text-gold-dark hover:underline">{pick(t.builder.change)}</button>
            )}
            <button onClick={() => setOpen(true)} className="btn-outline px-3 py-1.5 text-xs">{pick(t.tripInfo.editTripInfo)}</button>
            {onStartNew && (
              <button onClick={onStartNew} className="text-sm font-medium text-charcoal/45 hover:text-charcoal">{pick(t.builder.startNew)}</button>
            )}
          </div>
        </div>

        {/* Row 2 — auto-filled chips + info tooltip */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-charcoal/5 pt-2 text-xs text-charcoal/60">
          <InfoTooltip text={pick(t.tripInfo.autoFilledTooltip)} />
          {chips.map((c, i) => (
            <span key={i} className="whitespace-nowrap">
              {i > 0 && <span className="me-3 text-charcoal/25">·</span>}
              {c}
            </span>
          ))}
        </div>
      </div>

      {open && <EditModal onClose={() => setOpen(false)} />}
    </>
  );
}

function EditModal({ onClose }: { onClose: () => void }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const setTripInfo = useJourneyStore((s) => s.setTripInfo);
  const applyTripInfoToSteps = useJourneyStore((s) => s.applyTripInfoToSteps);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    // Re-resolve flights for the (possibly changed) dates so service times resync.
    if (tripInfo.departureFlightCode && tripInfo.departureDate) {
      const r = await resolveFlightAction(tripInfo.departureFlightCode, tripInfo.departureDate);
      setTripInfo(r.status === "matched" && r.matches.length === 1
        ? { departureFlight: r.matches[0], departureLookupStatus: "static_matched" }
        : { departureFlight: null, departureLookupStatus: r.status === "matched" ? undefined : "not_found" });
    }
    if (tripInfo.returnFlightCode && tripInfo.returnDate) {
      const r = await resolveFlightAction(tripInfo.returnFlightCode, tripInfo.returnDate);
      setTripInfo(r.status === "matched" && r.matches.length === 1
        ? { returnFlight: r.matches[0], returnLookupStatus: "static_matched" }
        : { returnFlight: null, returnLookupStatus: r.status === "matched" ? undefined : "not_found" });
    }
    applyTripInfoToSteps();
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-luxe bg-white p-6 shadow-luxe sm:rounded-luxe">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold text-charcoal">{pick(t.tripInfo.editTitle)}</h3>
          <button onClick={onClose} className="btn-ghost px-2 py-1 text-lg" aria-label="close">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">{pick(t.tripInfo.departureDate)}</span>
              <input type="date" min={today()} className="field-input" value={tripInfo.departureDate} onChange={(e) => setTripInfo({ departureDate: e.target.value })} />
            </label>
            <label className="block">
              <span className="field-label">{pick(t.tripInfo.returnDate)}</span>
              <input type="date" min={tripInfo.departureDate || today()} className="field-input" value={tripInfo.returnDate} onChange={(e) => setTripInfo({ returnDate: e.target.value })} />
            </label>
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
            <label className="block">
              <span className="field-label">{pick(t.tripInfo.assistanceNotes)}</span>
              <textarea className="field-input min-h-[70px] resize-y" value={tripInfo.assistanceNotes ?? ""} onChange={(e) => setTripInfo({ assistanceNotes: e.target.value })} placeholder={pick(t.tripInfo.assistanceHint)} />
            </label>
          )}

          {tripInfo.returnDate && tripInfo.departureDate && tripInfo.returnDate < tripInfo.departureDate && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {ar ? "تاريخ العودة لا يمكن أن يكون قبل تاريخ المغادرة." : "Return date cannot be before the departure date."}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">{pick(t.common.cancel)}</button>
          <button onClick={save} disabled={saving} className="btn-gold">{saving ? pick(t.common.loading) : pick(t.common.save)}</button>
        </div>
      </div>
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
