"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { getStep, LOUNGE_TYPES, getCity } from "@/lib/domain";
import {
  updateDestinationPricing,
  updateLoungePrice,
  updateServicePrice,
  updateVehicleMultiplier,
} from "@/server/actions/pricing.actions";
import type { CarCategory, StepType } from "@prisma/client";

interface Props {
  services: { stepType: string; basePrice: number; active: boolean }[];
  lounges: { loungeType: string; price: number; active: boolean }[];
  vehicles: { category: string; nameEn: string; multiplier: number }[];
  destinations: { cityCode: string; factor: number; surcharge: number }[];
}

export function PricingManager({ services, lounges, vehicles, destinations }: Props) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<"services" | "vehicles" | "lounges" | "destinations">("services");
  const [saving, setSaving] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>) {
    setSaving(key);
    await fn();
    setSaving(null);
    router.refresh();
  }

  const tabs = [
    { key: "services", label: pick(t.pricing.servicePricing) },
    { key: "vehicles", label: pick(t.pricing.vehiclePricing) },
    { key: "lounges", label: pick(t.pricing.loungePricing) },
    { key: "destinations", label: pick(t.pricing.destinationPricing) },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.pricing.servicePricing)}</h1>

      <div className="flex flex-wrap gap-2 border-b border-charcoal/10">
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2 text-sm font-medium transition ${tab === tb.key ? "border-b-2 border-gold text-charcoal" : "text-charcoal/50 hover:text-charcoal"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "services" && (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((s) => (
            <EditRow
              key={s.stepType}
              title={pick(getStep(s.stepType as StepType).name)}
              fields={[{ key: "basePrice", label: pick(t.pricing.basePrice), value: s.basePrice, step: 10 }]}
              active={s.active}
              busy={saving === s.stepType}
              onSave={(vals, active) => run(s.stepType, () => updateServicePrice(s.stepType as StepType, vals.basePrice, active))}
            />
          ))}
        </div>
      )}

      {tab === "vehicles" && (
        <div className="grid gap-3 md:grid-cols-3">
          {vehicles.map((v) => (
            <EditRow
              key={v.category}
              title={v.nameEn}
              fields={[{ key: "multiplier", label: pick(t.pricing.multiplier), value: v.multiplier, step: 0.1, float: true }]}
              busy={saving === v.category}
              onSave={(vals) => run(v.category, () => updateVehicleMultiplier(v.category as CarCategory, vals.multiplier))}
            />
          ))}
        </div>
      )}

      {tab === "lounges" && (
        <div className="grid gap-3 md:grid-cols-2">
          {lounges.map((l) => (
            <EditRow
              key={l.loungeType}
              title={LOUNGE_TYPES.find((x) => x.value === l.loungeType)?.name[locale] ?? l.loungeType}
              fields={[{ key: "price", label: pick(t.pricing.perStep), value: l.price, step: 10 }]}
              active={l.active}
              busy={saving === l.loungeType}
              onSave={(vals, active) => run(l.loungeType, () => updateLoungePrice(l.loungeType, vals.price, active))}
            />
          ))}
        </div>
      )}

      {tab === "destinations" && (
        <div className="grid gap-3 md:grid-cols-2">
          {destinations.map((d) => (
            <EditRow
              key={d.cityCode}
              title={getCity(d.cityCode)?.name[locale] ?? d.cityCode}
              fields={[
                { key: "factor", label: pick(t.pricing.factor), value: d.factor, step: 0.05, float: true },
                { key: "surcharge", label: pick(t.pricing.surcharge), value: d.surcharge, step: 10 },
              ]}
              busy={saving === d.cityCode}
              onSave={(vals) => run(d.cityCode, () => updateDestinationPricing(d.cityCode, vals.factor, vals.surcharge))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EditRow({
  title,
  fields,
  active,
  busy,
  onSave,
}: {
  title: string;
  fields: { key: string; label: string; value: number; step: number; float?: boolean }[];
  active?: boolean;
  busy: boolean;
  onSave: (vals: Record<string, number>, active: boolean) => void;
}) {
  const { t, pick } = useI18n();
  const [vals, setVals] = useState<Record<string, number>>(Object.fromEntries(fields.map((f) => [f.key, f.value])));
  const [isActive, setIsActive] = useState(active ?? true);

  return (
    <div className="luxe-card p-4">
      <p className="mb-3 font-medium text-charcoal">{title}</p>
      <div className="flex flex-wrap items-end gap-3">
        {fields.map((f) => (
          <label key={f.key} className="flex-1">
            <span className="field-label">{f.label}</span>
            <input
              type="number"
              step={f.step}
              min={0}
              className="field-input"
              value={vals[f.key]}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: f.float ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 }))}
            />
          </label>
        ))}
        {active !== undefined && (
          <label className="flex items-center gap-2 pb-2.5 text-sm text-charcoal/70">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-gold" />
            {pick(t.pricing.enabled)}
          </label>
        )}
        <button onClick={() => onSave(vals, isActive)} disabled={busy} className="btn-dark px-4 py-2 text-xs">
          {busy ? "…" : pick(t.pricing.save)}
        </button>
      </div>
    </div>
  );
}
