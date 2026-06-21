"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useJourneyStore } from "@/store/journeyStore";
import { resolveFlightAction } from "@/server/actions/flight.actions";
import { formatDateOnly } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Compact, elegant trip summary shown at the top of every service step. Values
 * are pre-filled from the Trip Information step (the source of truth). "Edit"
 * opens a modal that updates Trip Info and re-applies it across all steps.
 */
export function TripSummaryBar() {
  const { t, pick, locale } = useI18n();
  const tripInfo = useJourneyStore((s) => s.tripInfo);
  const [open, setOpen] = useState(false);

  const chips: { label: string; value: string }[] = [
    { label: pick(t.tripInfo.departureDate), value: tripInfo.departureDate ? formatDateOnly(tripInfo.departureDate, locale) : "—" },
    { label: pick(t.tripInfo.returnDate), value: tripInfo.returnDate ? formatDateOnly(tripInfo.returnDate, locale) : "—" },
    { label: pick(t.fields.passengers), value: String(tripInfo.passengers) },
    { label: pick(t.fields.bags), value: String(tripInfo.bags) },
  ];

  return (
    <>
      <div className="mb-5 rounded-2xl border border-gold/30 bg-gold-50/60 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {chips.map((c) => (
              <div key={c.label} className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-charcoal/45">{c.label}</p>
                <p className="text-sm font-semibold text-charcoal">{c.value}</p>
              </div>
            ))}
            {tripInfo.specialAssistance && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-charcoal/45">{pick(t.tripInfo.specialAssistanceLabel)}</p>
                <p className="text-sm font-semibold text-gold-dark">{pick(t.common.yes)}</p>
              </div>
            )}
          </div>
          <button onClick={() => setOpen(true)} className="btn-outline shrink-0 px-3 py-1.5 text-xs">
            {pick(t.common.edit)}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-charcoal/45">{pick(t.tripInfo.autoFilledNote)}</p>
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
