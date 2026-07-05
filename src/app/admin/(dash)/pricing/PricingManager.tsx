"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { getStep, LOUNGE_TYPES } from "@/lib/domain";
import {
  updateLoungePrice,
  updateServicePrice,
  updateVehicle,
} from "@/server/actions/pricing.actions";
import type { StepType } from "@prisma/client";

interface VehicleRow {
  category: string;
  nameEn: string;
  nameAr: string;
  maxPassengers: number;
  exampleModels: string;
  descriptionEn: string;
  descriptionAr: string;
  multiplier: number;
  isRecommended: boolean;
  sortOrder: number;
  active: boolean;
}

interface Props {
  services: { stepType: string; basePrice: number; active: boolean }[];
  lounges: { loungeType: string; price: number; active: boolean }[];
  vehicles: VehicleRow[];
}

export function PricingManager({ services, lounges, vehicles }: Props) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<"services" | "vehicles" | "lounges">("services");
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
        <div className="grid gap-3 md:grid-cols-2">
          {vehicles.map((v) => (
            <VehicleEditor
              key={v.category}
              vehicle={v}
              busy={saving === v.category}
              onSave={(payload) => run(v.category, () => updateVehicle(payload))}
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

/** Full editor for one vehicle category (names, capacity, models, flags, price). */
function VehicleEditor({
  vehicle,
  busy,
  onSave,
}: {
  vehicle: VehicleRow;
  busy: boolean;
  onSave: (payload: VehicleRow & { priceMultiplier: number }) => void;
}) {
  const { t, pick, locale } = useI18n();
  const [f, setF] = useState(vehicle);
  const set = <K extends keyof VehicleRow>(key: K, value: VehicleRow[K]) => setF((s) => ({ ...s, [key]: value }));

  return (
    <div className="luxe-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-charcoal">{vehicle.category}</p>
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-gold" />
          {pick(t.pricing.enabled)}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الاسم (EN)" : "Name (EN)"}</span>
          <input className="field-input" value={f.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الاسم (AR)" : "Name (AR)"}</span>
          <input className="field-input" value={f.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "أمثلة الطُرز" : "Example models"}</span>
          <input className="field-input" value={f.exampleModels} onChange={(e) => set("exampleModels", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الحد الأقصى للركاب" : "Max passengers"}</span>
          <input type="number" min={1} className="field-input" value={f.maxPassengers} onChange={(e) => set("maxPassengers", parseInt(e.target.value) || 1)} />
        </label>
        <label className="block">
          <span className="field-label">{pick(t.pricing.multiplier)}</span>
          <input type="number" step={0.1} min={0} className="field-input" value={f.multiplier} onChange={(e) => set("multiplier", parseFloat(e.target.value) || 0)} />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الترتيب" : "Sort order"}</span>
          <input type="number" min={0} className="field-input" value={f.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">{locale === "ar" ? "الوصف (EN)" : "Description (EN)"}</span>
          <input className="field-input" value={f.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">{locale === "ar" ? "الوصف (AR)" : "Description (AR)"}</span>
          <input className="field-input" value={f.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input type="checkbox" checked={f.isRecommended} onChange={(e) => set("isRecommended", e.target.checked)} className="h-4 w-4 accent-gold" />
          {locale === "ar" ? "موصى به" : "Recommended"}
        </label>
        <button onClick={() => onSave({ ...f, priceMultiplier: f.multiplier })} disabled={busy} className="btn-dark px-4 py-2 text-xs">
          {busy ? "…" : pick(t.pricing.save)}
        </button>
      </div>
    </div>
  );
}
