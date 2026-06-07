"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { SERVICE_TYPES, getCity, getStep, getVehicle } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";

export interface DisplayStep {
  stepOrder: number;
  stepType: string;
  city: string | null;
  airport: string | null;
  terminal: string | null;
  loungeType: string | null;
  flightNumber: string | null;
  scheduledAt: string | null;
  endAt: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  hotelName: string | null;
  hotelAddress: string | null;
  homeAddress: string | null;
  serviceType: string;
  carCategory: string | null;
  passengers: number | null;
  bags: number | null;
  days: number | null;
  dailyHours: number | null;
  skipped: boolean;
  notes: string | null;
}

export function RequestJourney({ steps }: { steps: DisplayStep[] }) {
  const { t, pick, locale } = useI18n();
  const visible = steps.filter((s) => !s.skipped);

  return (
    <ol className="relative space-y-4 ps-8">
      <span className="timeline-line bottom-4 start-[11px] top-2" aria-hidden />
      {visible.map((s) => {
        const def = getStep(s.stepType as any);
        const service = SERVICE_TYPES.find((x) => x.type === s.serviceType)?.name[locale];
        return (
          <li key={s.stepOrder} className="relative">
            <span className="absolute -start-8 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-gradient text-[0.6rem] font-bold text-charcoal ring-4 ring-white">
              {s.stepOrder}
            </span>
            <div className="luxe-card p-4">
              <p className="font-medium text-charcoal">{pick(def.name)}</p>
              <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {s.city && <Row k={pick(t.fields.city)} v={getCity(s.city)?.name[locale] ?? s.city} />}
                {s.airport && <Row k={pick(t.fields.airport)} v={s.airport} />}
                {s.terminal && <Row k={pick(t.fields.terminal)} v={s.terminal} />}
                {s.scheduledAt && <Row k={pick(t.fields.date)} v={formatDateTime(s.scheduledAt, locale)} />}
                {s.endAt && <Row k={pick(t.fields.endDate)} v={formatDateTime(s.endAt, locale)} />}
                {s.flightNumber && <Row k={pick(t.fields.flightNumber)} v={s.flightNumber} />}
                {(s.pickupLocation || s.homeAddress) && <Row k={pick(t.fields.pickup)} v={s.pickupLocation || s.homeAddress!} />}
                {(s.dropoffLocation || s.hotelName) && <Row k={pick(t.fields.dropoff)} v={s.dropoffLocation || s.hotelName!} />}
                {s.hotelAddress && <Row k={pick(t.fields.hotelAddress)} v={s.hotelAddress} />}
                {s.carCategory && <Row k={pick(t.fields.carCategory)} v={getVehicle(s.carCategory as any).name[locale]} />}
                {s.passengers != null && <Row k={pick(t.fields.passengers)} v={String(s.passengers)} />}
                {s.bags != null && <Row k={pick(t.fields.bags)} v={String(s.bags)} />}
                {s.days != null && <Row k={pick(t.fields.days)} v={String(s.days)} />}
                {s.dailyHours != null && <Row k={pick(t.fields.dailyHours)} v={String(s.dailyHours)} />}
                {service && <Row k={pick(t.builder.serviceType)} v={service} />}
                {s.notes && <Row k={pick(t.fields.notes)} v={s.notes} />}
              </dl>
            </div>
          </li>
        );
      })}
      {visible.length === 0 && <li className="text-sm text-charcoal/40">{pick(t.builder.emptyJourney)}</li>}
    </ol>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-charcoal/5 py-1">
      <dt className="text-charcoal/45">{k}</dt>
      <dd className="text-end font-medium text-charcoal">{v}</dd>
    </div>
  );
}
