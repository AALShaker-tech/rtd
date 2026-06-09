"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buildWhatsAppLink } from "@/lib/whatsapp";
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
  notes: string | null;
  steps: JourneyStepInput[];
}) {
  const { t, pick, locale } = useI18n();

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
    notes: props.notes,
    locale,
  });

  const active = props.steps.filter((s) => !s.skipped && s.serviceType !== "SKIP");

  return (
    <div className="ink-wrap rise pb-20 pt-8">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold-gradient text-ink">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="disp mt-4 text-[26px] font-semibold text-cream">{pick(t.success.title)}</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-dim">{pick(t.success.message)}</p>
      </div>

      {/* Reference */}
      <div className="mt-6 rounded-2xl border gold-line p-5 text-center" style={{ background: "rgba(201,168,106,.08)" }}>
        <p className="text-[11px] uppercase tracking-widest text-gold">{pick(t.success.reference)}</p>
        <p className="disp mt-1 text-[26px] font-bold text-cream">{props.referenceNumber}</p>
      </div>

      {/* Estimated total */}
      <div className="mt-3 flex items-center justify-between rounded-2xl border gold-line p-4" style={{ background: "linear-gradient(135deg, rgba(201,168,106,.14), rgba(201,168,106,.04))" }}>
        <span className="text-[14px] text-cream">{pick(t.pricing.estimatedTotal)}</span>
        <span className="disp text-[22px] font-semibold text-gold">{formatPrice(props.estimatedTotal, locale)}</span>
      </div>
      <p className="mt-2 text-center text-[12px] text-dim">{pick(t.pricing.finalNote)}</p>

      {/* Status */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-[13px] text-dim">{pick(t.success.statusTimeline)}</span>
        <StatusBadge status={props.status} />
      </div>

      {/* Summary */}
      <div className="mt-3 rounded-2xl border gold-line bg-ink-800 p-4">
        <p className="mb-2.5 text-[13px] font-semibold text-cream">{pick(t.builder.summaryTitle)}</p>
        <ol className="grid gap-2">
          {active.map((s, i) => (
            <li key={s.stepType} className="flex items-center gap-2 text-[13.5px] text-dim">
              <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-gold-gradient text-[0.62rem] font-bold text-ink">{i + 1}</span>
              {pick(getStep(s.stepType).shortName)}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <a href={waLink} target="_blank" rel="noreferrer" className="gbtn mt-5 w-full">
        <WhatsAppIcon /> {pick(t.success.continueWhatsapp)}
      </a>
      <Link href={`/status?ref=${props.referenceNumber}`} className="obtn mt-3 w-full justify-center text-cream">
        {pick(t.success.trackRequest)}
      </Link>
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
