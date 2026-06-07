"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { PACKAGES, getStep } from "@/lib/domain";
import { useJourneyStore } from "@/store/journeyStore";

export default function PackagesPage() {
  const { t, pick } = useI18n();
  const router = useRouter();
  const applyPackage = useJourneyStore((s) => s.applyPackage);
  const startBlank = useJourneyStore((s) => s.startBlank);

  function choose(type: Parameters<typeof applyPackage>[0]) {
    applyPackage(type);
    router.push("/journey");
  }

  return (
    <div className="luxe-container py-14 md:py-20">
      <div className="mb-12 text-center">
        <div className="gold-rule mx-auto mb-6" />
        <h1 className="text-4xl font-semibold text-charcoal md:text-5xl">{pick(t.packages.title)}</h1>
        <p className="mx-auto mt-4 max-w-xl text-charcoal/60">{pick(t.packages.subtitle)}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PACKAGES.map((p) => (
          <div
            key={p.type}
            className={`luxe-card luxe-card-hover flex flex-col p-7 ${p.featured ? "ring-2 ring-gold" : ""}`}
          >
            {p.featured && (
              <span className="badge mb-3 w-fit bg-gold-gradient text-charcoal">
                {pick({ en: "Featured", ar: "مميزة" })}
              </span>
            )}
            <h3 className="font-serif text-2xl font-semibold text-charcoal">{pick(p.name)}</h3>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/60">{pick(p.description)}</p>

            <div className="mt-5 flex-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-dark">
                {pick(t.packages.includes)}
              </p>
              <ul className="space-y-1.5">
                {p.steps.slice(0, 5).map((st) => (
                  <li key={st} className="flex items-start gap-2 text-sm text-charcoal/70">
                    <Check />
                    {pick(getStep(st).shortName)}
                  </li>
                ))}
                {p.steps.length > 5 && (
                  <li className="ps-6 text-xs text-charcoal/40">
                    {pick({ en: `+ ${p.steps.length - 5} more`, ar: `+ ${p.steps.length - 5} أخرى` })}
                  </li>
                )}
              </ul>
            </div>

            <button onClick={() => choose(p.type)} className="btn-dark mt-6 w-full">
              {pick(t.packages.choose)}
            </button>
            <p className="mt-3 text-center text-xs text-charcoal/40">{pick(t.packages.tailoredOffer)}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/journey" onClick={() => startBlank()} className="btn-outline">
          {pick(t.packages.buildOwn)}
        </Link>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mt-0.5 shrink-0 text-gold-dark">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
