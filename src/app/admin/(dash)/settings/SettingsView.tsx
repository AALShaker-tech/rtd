"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { STEPS, VEHICLES } from "@/lib/domain";
import { SettingsIntegrations } from "./SettingsIntegrations";
import type { AdminSettings } from "@/server/services/settings.service";

export function SettingsView(props: {
  settings: AdminSettings;
  smsProvider: string;
  adminEmail: string;
  canEdit: boolean;
}) {
  const { t, pick, locale } = useI18n();
  const [tab, setTab] = useState<"integrations" | "services" | "vehicles">("integrations");

  const tabs = [
    { key: "integrations", label: pick(t.admin.whatsappSettings) },
    { key: "services", label: pick(t.admin.services) },
    { key: "vehicles", label: pick(t.admin.vehicles) },
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
              tab === tb.key
                ? "border-b-2 border-gold text-charcoal"
                : "text-charcoal/50 hover:text-charcoal"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab !== "integrations" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {locale === "ar"
            ? "للاطلاع فقط — هذه القوائم معرّفة في الكود. تُدار الأسعار من صفحة التسعير، والتوفّر (تفعيل/تعطيل) من صفحة المدن."
            : "Reference only — these are defined in code. Prices are managed on the Pricing page; availability (enable/disable) on the Cities page."}
        </p>
      )}

      {tab === "integrations" && (
        <SettingsIntegrations
          settings={props.settings}
          smsProvider={props.smsProvider}
          adminEmail={props.adminEmail}
          canEdit={props.canEdit}
        />
      )}

      {tab === "services" && (
        <div className="grid gap-3 md:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.type} className="luxe-card p-4">
              <p className="font-medium text-charcoal">
                {s.order}. {pick(s.name)}
              </p>
              <p className="mt-1 text-sm text-charcoal/50">{pick(s.description)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "vehicles" && (
        <div className="grid gap-4 md:grid-cols-3">
          {VEHICLES.map((v) => (
            <div
              key={v.category}
              className={`luxe-card p-5 ${v.isRecommended ? "ring-2 ring-gold" : ""}`}
            >
              <h3 className="gold-text text-xl font-semibold">{pick(v.name)}</h3>
              <p className="text-sm text-charcoal/60">{v.exampleModels}</p>
              <p className="mt-2 text-sm text-charcoal/50">
                {locale === "ar"
                  ? `حتى ${v.maxPassengers} ركاب`
                  : `Up to ${v.maxPassengers} passengers`}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
