"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { getCity, getPackage, getStep } from "@/lib/domain";
import { useJourneyStore } from "@/store/journeyStore";
import { validateJourney } from "@/lib/validation/journey";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Mini journey summary — sticky sidebar on desktop, collapsible on mobile. */
export function JourneySummary({ collapsible = false }: { collapsible?: boolean }) {
  const { t, pick, locale } = useI18n();
  const steps = useJourneyStore((s) => s.steps);
  const selectedPackage = useJourneyStore((s) => s.selectedPackage);
  const customer = useJourneyStore((s) => s.customer);
  const phoneVerified = useJourneyStore((s) => s.phoneVerified);
  const emailVerified = useJourneyStore((s) => s.emailVerified);
  const [open, setOpen] = useState(!collapsible);

  const active = steps.filter((s) => !s.skipped && s.serviceType !== "SKIP");
  const ordered = [...active].sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order);

  const validation = useMemo(
    () => validateJourney({ steps, customer, phoneVerified, emailVerified, selectedPackage }),
    [steps, customer, phoneVerified, emailVerified, selectedPackage],
  );

  const body = (
    <>
      {selectedPackage && (
        <div className="mb-4 rounded-lg bg-gold-50 px-3 py-2 text-xs font-medium text-gold-dark">
          {pick(getPackage(selectedPackage)!.name)}
        </div>
      )}

      {ordered.length === 0 ? (
        <p className="py-6 text-center text-sm text-charcoal/40">{pick(t.builder.emptyJourney)}</p>
      ) : (
        <ol className="relative space-y-4 ps-6">
          <span className="timeline-line bottom-2 start-[7px] h-[calc(100%-1rem)] animate-draw-line" aria-hidden />
          {ordered.map((s, i) => {
            const def = getStep(s.stepType);
            return (
              <li key={s.stepType} className="relative">
                <span className="absolute -start-6 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold-gradient ring-4 ring-white" aria-hidden />
                <p className="text-sm font-medium leading-tight text-charcoal">{pick(def.shortName)}</p>
                <p className="text-xs text-charcoal/50">
                  {s.city ? getCity(s.city)?.name[locale] : ""}
                  {s.date ? ` · ${formatDateTime(`${s.date}T${s.time ?? "00:00"}`, locale, { dateStyle: "medium", timeStyle: s.time ? "short" : undefined })}` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-charcoal/5 pt-4 text-xs">
        <span className="badge bg-charcoal/5 text-charcoal/70">
          {active.length} {locale === "ar" ? "خدمة" : active.length === 1 ? "service" : "services"}
        </span>
        {validation.hasErrors ? (
          <span className="badge bg-red-50 text-red-700">
            {locale === "ar" ? "يوجد أمور للتصحيح" : "Has issues"}
          </span>
        ) : active.length > 0 ? (
          <span className="badge bg-emerald-50 text-emerald-700">{pick(t.review.valid)}</span>
        ) : null}
      </div>
    </>
  );

  if (!collapsible) {
    return (
      <aside className="luxe-card sticky top-20 p-5">
        <h3 className="mb-4 font-serif text-lg font-semibold text-charcoal">{pick(t.builder.summaryTitle)}</h3>
        {body}
      </aside>
    );
  }

  return (
    <div className="luxe-card p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between">
        <span className="font-serif text-base font-semibold text-charcoal">{pick(t.builder.summaryTitle)}</span>
        <span className={cn("text-charcoal/40 transition", open && "rotate-180")}>▾</span>
      </button>
      {open && <div className="mt-4">{body}</div>}
    </div>
  );
}
