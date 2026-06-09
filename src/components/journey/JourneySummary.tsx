"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { getCity, getStep } from "@/lib/domain";
import { useJourneyStore } from "@/store/journeyStore";
import { usePricing } from "@/components/pricing/PricingProvider";
import { computeStepPrice, formatPrice } from "@/lib/pricing";
import { formatDateTime } from "@/lib/utils";

/**
 * Journey + pricing summary. Sticky sidebar on desktop, collapsible on mobile.
 * Prices come from the same `computeStepPrice` engine as everywhere else.
 */
export function JourneySummary({ sticky = true }: { sticky?: boolean }) {
  const { t, pick, locale } = useI18n();
  const steps = useJourneyStore((s) => s.steps);
  const destination = useJourneyStore((s) => s.destination);
  const { config } = usePricing();

  const active = steps
    .filter((s) => !s.skipped && s.serviceType !== "SKIP")
    .sort((a, b) => getStep(a.stepType).order - getStep(b.stepType).order);
  const total = active.reduce((sum, s) => sum + computeStepPrice(s, config).computedPrice, 0);

  return (
    <aside className={`luxe-card p-6 ${sticky ? "lg:sticky lg:top-24" : ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-charcoal">{pick(t.builder.summaryTitle)}</h3>
        {destination && <span className="badge bg-gold-50 text-gold-dark">{getCity(destination)?.name[locale]}</span>}
      </div>

      {active.length === 0 ? (
        <p className="py-6 text-center text-sm text-charcoal/40">{pick(t.builder.emptyJourney)}</p>
      ) : (
        <ol className="space-y-3">
          {active.map((s) => {
            const def = getStep(s.stepType);
            const price = computeStepPrice(s, config).computedPrice;
            return (
              <li key={s.stepType} className="flex items-start justify-between gap-3 border-b border-charcoal/5 pb-3 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight text-charcoal">{pick(def.shortName)}</p>
                  <p className="truncate text-xs text-charcoal/45">
                    {s.city ? getCity(s.city)?.name[locale] : ""}
                    {s.date ? ` · ${formatDateTime(`${s.date}T${s.time ?? "00:00"}`, locale, { dateStyle: "short", timeStyle: s.time ? "short" : undefined })}` : ""}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-charcoal">{formatPrice(price, locale)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Estimated total */}
      <div className="mt-4 rounded-xl bg-gold-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-charcoal">{pick(t.pricing.estimatedTotal)}</span>
          <span className="font-serif text-xl font-semibold text-gold-dark">{formatPrice(total, locale)}</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-charcoal/45">{pick(t.pricing.finalNote)}</p>
    </aside>
  );
}
