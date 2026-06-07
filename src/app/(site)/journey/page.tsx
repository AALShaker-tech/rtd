"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { getStep } from "@/lib/domain";
import { ALL_STEPS, useJourneyStore } from "@/store/journeyStore";
import { JourneyProgress } from "@/components/journey/JourneyProgress";
import { JourneySummary } from "@/components/journey/JourneySummary";
import { StepForm } from "@/components/journey/StepForm";
import { cn } from "@/lib/utils";

export default function JourneyBuilderPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const steps = useJourneyStore((s) => s.steps);
  const toggleStep = useJourneyStore((s) => s.toggleStep);
  const hasStep = useJourneyStore((s) => s.hasStep);
  const [expanded, setExpanded] = useState<string | null>(null);

  const activeCount = steps.filter((s) => !s.skipped && s.serviceType !== "SKIP").length;

  function continueToDetails() {
    router.push("/journey/details");
  }

  return (
    <div className="luxe-container py-10 md:py-14">
      <JourneyProgress current="build" />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.builder.title)}</h1>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/60">{pick(t.builder.subtitle)}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Catalogue */}
        <div className="space-y-3">
          {/* mobile summary */}
          <div className="lg:hidden">
            <JourneySummary collapsible />
          </div>

          {ALL_STEPS.map((s) => {
            const included = hasStep(s.type);
            const isOpen = expanded === s.type;
            const def = getStep(s.type);
            return (
              <div
                key={s.type}
                className={cn(
                  "luxe-card overflow-hidden transition",
                  included ? "border-gold/40" : "",
                )}
              >
                <div className="flex items-center gap-4 p-4">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition",
                      included ? "bg-gold-gradient text-charcoal" : "bg-charcoal/5 text-charcoal/50",
                    )}
                  >
                    {def.order}
                  </span>
                  <button
                    className="flex-1 text-start"
                    onClick={() => (included ? setExpanded(isOpen ? null : s.type) : toggleStep(s.type))}
                  >
                    <p className="font-medium text-charcoal">{pick(s.name)}</p>
                    <p className="text-xs text-charcoal/50 line-clamp-1">{pick(s.description)}</p>
                  </button>

                  {included ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpanded(isOpen ? null : s.type)} className="btn-ghost px-3 py-1.5 text-xs">
                        {isOpen ? pick(t.common.save) : pick(t.common.edit)}
                      </button>
                      <button
                        onClick={() => {
                          toggleStep(s.type);
                          if (isOpen) setExpanded(null);
                        }}
                        className="btn-ghost px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
                        aria-label="remove"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { toggleStep(s.type); setExpanded(s.type); }} className="btn-outline px-4 py-1.5 text-xs">
                      + {pick(t.builder.addStep)}
                    </button>
                  )}
                </div>

                {included && isOpen && (
                  <div className="border-t border-charcoal/5 bg-ivory-warm/40 p-5">
                    <StepForm stepType={s.type} />
                  </div>
                )}
              </div>
            );
          })}

          <p className="pt-2 text-center text-xs text-charcoal/40">{pick(t.builder.softReminder)}</p>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
            <button onClick={() => router.push("/packages")} className="btn-ghost">
              ← {pick(t.common.back)}
            </button>
            <button onClick={continueToDetails} disabled={activeCount === 0} className="btn-gold">
              {pick(t.builder.continueDetails)} →
            </button>
          </div>
        </div>

        {/* Desktop summary */}
        <div className="hidden lg:block">
          <JourneySummary />
        </div>
      </div>
    </div>
  );
}
