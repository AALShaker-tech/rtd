"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { lookupFlightAction } from "@/server/actions/flight.actions";
import type { JourneyStepInput } from "@/lib/types";
import type { NormalizedFlight } from "@/lib/flight";

/**
 * Flight lookup card. Calls our backend action (never the flight API directly),
 * normalizes into the journey step, and always allows manual entry as fallback.
 */
export function FlightLookup({
  step,
  onChange,
}: {
  step: JourneyStepInput;
  onChange: (patch: Partial<JourneyStepInput>) => void;
}) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const flight = step.flightData as NormalizedFlight | null | undefined;

  async function lookup() {
    if (!step.flightNumber) return;
    setLoading(true);
    setError(undefined);
    const res = await lookupFlightAction(step.flightNumber, step.date);
    setLoading(false);
    if (res.ok) {
      onChange({ flightData: res.flight, flightLookupStatus: "VERIFIED" });
    } else {
      onChange({ flightData: null, flightLookupStatus: "LOOKUP_FAILED" });
      setError(
        res.reason === "NOT_FOUND"
          ? ar ? "لم نعثر على الرحلة. يمكنك إدخال التفاصيل يدويًا." : "Flight not found. You can enter details manually."
          : ar ? "تعذّر جلب البيانات الآن. يمكنك المتابعة يدويًا." : "Couldn't fetch details now. You can continue manually.",
      );
    }
  }

  return (
    <div>
      <label className="field-label">{pick(t.fields.flightLabel)}</label>
      <div className="flex gap-2">
        <input
          value={step.flightNumber ?? ""}
          onChange={(e) => onChange({ flightNumber: e.target.value.toUpperCase() || undefined, flightData: null, flightLookupStatus: "MANUAL" })}
          placeholder="SV021"
          className="field-input flex-1"
        />
        <button onClick={lookup} disabled={loading || !step.flightNumber} className="btn-outline shrink-0 px-5 py-2 text-xs">
          {loading ? "…" : ar ? "جلب" : "Fetch"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-amber-700">{error}</p>}

      {flight && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Info label={ar ? "الناقل" : "Airline"} value={flight.airline} />
          <Info label={ar ? "رقم الرحلة" : "Flight no."} value={flight.flightNumber} />
          <Info label={ar ? "الصالة" : "Terminal"} value={flight.departureTerminal ?? "—"} />
          <Info label={ar ? "البوابة" : "Gate"} value={flight.gate ?? "—"} />
          <Info label={ar ? "الإقلاع" : "Departure"} value={flight.departureDateTime ? new Date(flight.departureDateTime).toLocaleString(ar ? "ar-SA" : "en-GB", { timeStyle: "short", dateStyle: "short" }) : "—"} />
          <Info label={ar ? "الحالة" : "Status"} value={flight.status ?? "—"} />
          <p className="col-span-2 text-center text-[11px] text-charcoal/40 sm:col-span-3">
            {flight.source === "mock"
              ? ar ? "* بيانات محاكاة — تتحوّل لبيانات حقيقية عند تفعيل مزوّد" : "* Mock data — switches to live once a provider is enabled"
              : ar ? "تم التحقق من بيانات الرحلة" : "Flight details verified"}
          </p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-charcoal/5 bg-ivory-warm px-3 py-2.5">
      <div className="text-[11px] text-charcoal/45">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-charcoal">{value}</div>
    </div>
  );
}
