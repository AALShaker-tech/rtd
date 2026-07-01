"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useJourneyStore } from "@/store/journeyStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buildWhatsAppLink, type WhatsAppFlightLine } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/pricing";
import { getStep } from "@/lib/domain";
import type { JourneyStepInput } from "@/lib/types";
import type { CarCategory, PackageType, RequestStatus } from "@/lib/domain";

export function SuccessView(props: {
  referenceNumber: string;
  status: RequestStatus;
  customerName: string;
  phone: string;
  selectedPackage: PackageType | null;
  carCategory: CarCategory;
  passengers: number;
  bags: number;
  estimatedTotal: number;
  specialAssistance?: boolean;
  assistanceNotes?: string | null;
  departureFlight?: WhatsAppFlightLine | null;
  returnFlight?: WhatsAppFlightLine | null;
  notes: string | null;
  steps: JourneyStepInput[];
}) {
  const { t, pick, locale } = useI18n();

  // The request is now saved server-side (this page reads it from the DB), so
  // the client draft is no longer needed. Clear it here — after a confirmed
  // success — so the review page never re-validates emptied data.
  useEffect(() => {
    useJourneyStore.getState().reset();
  }, []);

  const waLink = buildWhatsAppLink({
    referenceNumber: props.referenceNumber,
    customerName: props.customerName,
    phone: props.phone,
    selectedPackage: props.selectedPackage,
    steps: props.steps,
    carCategory: props.carCategory,
    passengers: props.passengers,
    bags: props.bags,
    estimatedTotal: props.estimatedTotal,
    specialAssistance: props.specialAssistance,
    assistanceNotes: props.assistanceNotes,
    departureFlight: props.departureFlight,
    returnFlight: props.returnFlight,
    notes: props.notes,
    locale,
  });
  const active = props.steps.filter((s) => !s.skipped && s.serviceType !== "SKIP");

  return (
    <div className="luxe-container max-w-2xl py-14 md:py-20">
      <div className="luxe-card overflow-hidden">
        <div className="lux-dark p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#101012" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="text-3xl font-semibold text-ivory">{pick(t.success.title)}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ivory/70">{pick(t.success.message)}</p>
        </div>

        <div className="p-8">
          <div className="mb-5 rounded-luxe border border-gold/30 bg-gold-50 p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-gold-dark">{pick(t.success.reference)}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-charcoal">{props.referenceNumber}</p>
          </div>

          <div className="mb-5 flex items-center justify-between rounded-luxe bg-ivory-warm p-4">
            <span className="text-sm font-medium text-charcoal">{pick(t.pricing.estimatedTotal)}</span>
            <span className="font-serif text-2xl font-semibold text-gold-dark">{formatPrice(props.estimatedTotal, locale)}</span>
          </div>
          <p className="-mt-3 mb-5 text-center text-xs text-charcoal/45">{pick(t.pricing.finalNote)}</p>

          <div className="mb-5 flex items-center justify-between">
            <span className="text-sm text-charcoal/50">{pick(t.success.statusTimeline)}</span>
            <StatusBadge status={props.status} />
          </div>

          <div className="mb-6 rounded-luxe bg-ivory-warm p-5">
            <p className="mb-3 text-sm font-semibold text-charcoal">{pick(t.builder.summaryTitle)}</p>
            <ol className="space-y-2">
              {active.map((s, i) => (
                <li key={s.stepType} className="flex items-center gap-2 text-sm text-charcoal/70">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-charcoal text-[0.62rem] font-bold text-gold-light">{i + 1}</span>
                  {pick(getStep(s.stepType).shortName)}
                </li>
              ))}
            </ol>
          </div>

          <a href={waLink} target="_blank" rel="noreferrer" className="btn-gold w-full">
            <WhatsAppIcon /> {pick(t.success.continueWhatsapp)}
          </a>
          <Link href={`/status?ref=${props.referenceNumber}`} className="btn-outline mt-3 w-full">{pick(t.success.trackRequest)}</Link>
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.32-1.95 1.36-.5.05-1.13.21-3.65-.76-3.07-1.21-5.04-4.34-5.2-4.54-.15-.2-1.24-1.65-1.24-3.15s.79-2.24 1.07-2.54c.28-.31.6-.38.8-.38.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.83 2.04.9 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.45.53-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12 1 2.07 1.31 2.37 1.46.3.15.47.12.65-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.34.07.12.07.71-.17 1.39z" />
    </svg>
  );
}
