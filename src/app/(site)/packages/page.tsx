"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { PACKAGES, getStep } from "@/lib/domain";
import { useJourneyStore } from "@/store/journeyStore";

export default function PackagesPage() {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const router = useRouter();
  const applyPackage = useJourneyStore((s) => s.applyPackage);
  const startBlank = useJourneyStore((s) => s.startBlank);

  function choose(type: Parameters<typeof applyPackage>[0]) {
    applyPackage(type);
    router.push("/journey");
  }

  return (
    <div className="ink-wrap rise pb-16 pt-6">
      <h1 className="disp text-[26px] font-semibold text-cream">{pick(t.packages.title)}</h1>
      <p className="mb-5 mt-1.5 text-[14.5px] text-dim">{pick(t.packages.subtitle)}</p>

      <div className="grid gap-3">
        {PACKAGES.map((p) => (
          <div key={p.type} className={`dcard p-5 ${p.featured ? "dcard-selected" : ""}`}>
            {p.featured && (
              <span className="mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] text-gold" style={{ background: "rgba(201,168,106,.14)" }}>
                {ar ? "مميزة" : "Featured"}
              </span>
            )}
            <h3 className="disp text-[20px] font-semibold text-cream">{pick(p.name)}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-dim">{pick(p.description)}</p>
            <ul className="mt-3 grid gap-1.5">
              {p.steps.slice(0, 5).map((st) => (
                <li key={st} className="flex items-center gap-2 text-[13px] text-cream/90">
                  <span className="text-gold">✓</span> {pick(getStep(st).shortName)}
                </li>
              ))}
              {p.steps.length > 5 && <li className="text-[12px] text-dim">+ {p.steps.length - 5} {ar ? "أخرى" : "more"}</li>}
            </ul>
            <button onClick={() => choose(p.type)} className="gbtn mt-4 w-full">{pick(t.packages.choose)}</button>
            <p className="mt-2 text-center text-[12px] text-dim">{pick(t.packages.tailoredOffer)}</p>
          </div>
        ))}
      </div>

      <button onClick={() => { startBlank(); router.push("/journey"); }} className="obtn mt-6 w-full justify-center text-cream">
        {pick(t.packages.buildOwn)}
      </button>
    </div>
  );
}
