"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { PACKAGES, STEPS, VEHICLES } from "@/lib/domain";

export function SettingsView(props: {
  whatsappNumber: string;
  whatsappDisplay: string;
  smsProvider: string;
  emailProvider: string;
}) {
  const { t, pick, locale } = useI18n();
  const [tab, setTab] = useState<"whatsapp" | "services" | "vehicles" | "packages">("whatsapp");

  const tabs = [
    { key: "whatsapp", label: pick(t.admin.whatsappSettings) },
    { key: "services", label: pick(t.admin.services) },
    { key: "vehicles", label: pick(t.admin.vehicles) },
    { key: "packages", label: pick(t.packages.title) },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.admin.settings)}</h1>

      <div className="flex flex-wrap gap-2 border-b border-charcoal/10">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === tb.key ? "border-b-2 border-gold text-charcoal" : "text-charcoal/50 hover:text-charcoal"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "whatsapp" && (
        <div className="luxe-card max-w-lg space-y-3 p-6">
          <Note>
            {locale === "ar"
              ? "تُضبط هذه القيم عبر متغيرات البيئة (NEXT_PUBLIC_WHATSAPP_*) ولا تُخزَّن أي أسرار في الكود."
              : "These values are configured via environment variables (NEXT_PUBLIC_WHATSAPP_*). No secrets are stored in code."}
          </Note>
          <Field k={locale === "ar" ? "رقم واتساب" : "WhatsApp number"} v={props.whatsappDisplay} />
          <Field k="wa.me" v={`https://wa.me/${props.whatsappNumber}`} />
          <Field k={locale === "ar" ? "مزود الرسائل" : "SMS provider"} v={props.smsProvider} />
          <Field k={locale === "ar" ? "مزود البريد" : "Email provider"} v={props.emailProvider} />
        </div>
      )}

      {tab === "services" && (
        <div className="grid gap-3 md:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.type} className="luxe-card p-4">
              <p className="font-medium text-charcoal">{s.order}. {pick(s.name)}</p>
              <p className="mt-1 text-sm text-charcoal/50">{pick(s.description)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "vehicles" && (
        <div className="grid gap-4 md:grid-cols-3">
          {VEHICLES.map((v) => (
            <div key={v.category} className={`luxe-card p-5 ${v.isRecommended ? "ring-2 ring-gold" : ""}`}>
              <h3 className="gold-text text-xl font-semibold">{pick(v.name)}</h3>
              <p className="text-sm text-charcoal/60">{v.exampleModels}</p>
              <p className="mt-2 text-sm text-charcoal/50">
                {locale === "ar" ? `حتى ${v.maxPassengers} ركاب` : `Up to ${v.maxPassengers} passengers`}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "packages" && (
        <div className="grid gap-3 md:grid-cols-2">
          {PACKAGES.map((p) => (
            <div key={p.type} className="luxe-card p-4">
              <p className="font-medium text-charcoal">{pick(p.name)}</p>
              <p className="mt-1 text-sm text-charcoal/50">{pick(p.description)}</p>
              <p className="mt-2 text-xs text-charcoal/40">{p.steps.length} {pick(t.admin.services)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-ivory-warm px-4 py-3">
      <span className="text-sm text-charcoal/60">{k}</span>
      <span className="font-mono text-sm text-charcoal">{v}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-gold-50 px-4 py-3 text-xs text-gold-dark">{children}</p>;
}
