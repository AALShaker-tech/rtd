"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { getStep, type PackageType, type StepType } from "@/lib/domain";
import { packageName, packageDescription, type CatalogPackage } from "@/lib/packages";
import { useJourneyStore } from "@/store/journeyStore";

export function PackagesView({ packages }: { packages: CatalogPackage[] }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const router = useRouter();
  const applyPackage = useJourneyStore((s) => s.applyPackage);
  const startBlank = useJourneyStore((s) => s.startBlank);

  function choose(p: CatalogPackage) {
    applyPackage(p.type as PackageType, p.steps as StepType[]);
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
        {packages.map((p) => (
          <div key={p.type} className={`luxe-card luxe-card-hover flex flex-col p-7 ${p.featured ? "ring-2 ring-gold" : ""}`}>
            {p.featured && <span className="badge mb-3 w-fit bg-gold-gradient text-charcoal">{ar ? "مميزة" : "Featured"}</span>}
            <h3 className="font-serif text-2xl font-semibold text-charcoal">{packageName(p, locale)}</h3>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/60">{packageDescription(p, locale)}</p>
            <div className="mt-5 flex-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-dark">{pick(t.packages.includes)}</p>
              <ul className="space-y-1.5">
                {p.steps.slice(0, 5).map((st) => (
                  <li key={st} className="flex items-start gap-2 text-sm text-charcoal/70"><Check />{pick(getStep(st as StepType).shortName)}</li>
                ))}
                {p.steps.length > 5 && <li className="ps-6 text-xs text-charcoal/40">+ {p.steps.length - 5} {ar ? "أخرى" : "more"}</li>}
              </ul>
            </div>
            <button onClick={() => choose(p)} className="btn-dark mt-6 w-full">{pick(t.packages.choose)}</button>
            <p className="mt-3 text-center text-xs text-charcoal/40">{pick(t.packages.tailoredOffer)}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button onClick={() => { startBlank(); router.push("/journey"); }} className="btn-outline">{pick(t.packages.buildOwn)}</button>
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
