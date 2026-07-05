"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { getStep, LOUNGE_TYPES } from "@/lib/domain";
import {
  setServiceClassPrice,
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
  isRecommended: boolean;
  sortOrder: number;
  active: boolean;
}

interface ServiceRow {
  stepType: string;
  isCar: boolean;
  basePrice: number;
  active: boolean;
  classPrices: { category: string; price: number }[];
}

interface Props {
  services: ServiceRow[];
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
          {services.map((s) =>
            s.isCar ? (
              <ServiceClassEditor
                key={s.stepType}
                title={pick(getStep(s.stepType as StepType).name)}
                active={s.active}
                classPrices={s.classPrices}
                vehicles={vehicles}
                busy={saving === s.stepType}
                onSaveClass={(category, price) =>
                  run(`${s.stepType}:${category}`, () => setServiceClassPrice(s.stepType as StepType, category, price))
                }
                onSaveActive={(active) =>
                  run(`${s.stepType}:active`, () => updateServicePrice(s.stepType as StepType, s.basePrice, active))
                }
              />
            ) : (
              <EditRow
                key={s.stepType}
                title={pick(getStep(s.stepType as StepType).name)}
                fields={[{ key: "basePrice", label: pick(t.pricing.basePrice), value: s.basePrice, step: 10 }]}
                active={s.active}
                busy={saving === s.stepType}
                onSave={(vals, active) => run(s.stepType, () => updateServicePrice(s.stepType as StepType, vals.basePrice, active))}
              />
            ),
          )}
        </div>
      )}

      {tab === "vehicles" && (
        <div className="space-y-3">
          <NewVehicleClass onCreate={(payload) => run(`new:${payload.category}`, () => updateVehicle(payload))} busy={saving?.startsWith("new:") ?? false} />
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

/** Per-class price editor for a car service (direct amounts, no multiplier). */
function ServiceClassEditor({
  title,
  active,
  classPrices,
  vehicles,
  busy,
  onSaveClass,
  onSaveActive,
}: {
  title: string;
  active: boolean;
  classPrices: { category: string; price: number }[];
  vehicles: VehicleRow[];
  busy: boolean;
  onSaveClass: (category: string, price: number) => void;
  onSaveActive: (active: boolean) => void;
}) {
  const { t, pick, locale } = useI18n();
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(classPrices.map((c) => [c.category, c.price])),
  );
  const [isActive, setIsActive] = useState(active);
  const label = (cat: string) => vehicles.find((v) => v.category === cat)?.[locale === "ar" ? "nameAr" : "nameEn"] ?? cat;

  return (
    <div className="luxe-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-charcoal">{title}</p>
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => { setIsActive(e.target.checked); onSaveActive(e.target.checked); }}
            className="h-4 w-4 accent-gold"
          />
          {pick(t.pricing.enabled)}
        </label>
      </div>
      <div className="grid gap-2">
        {classPrices.map((c) => (
          <div key={c.category} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-charcoal/80">
              {label(c.category)} <span className="text-charcoal/40">({c.category})</span>
            </span>
            <input
              type="number" min={0} step={10}
              value={prices[c.category] ?? 0}
              onChange={(e) => setPrices((p) => ({ ...p, [c.category]: parseInt(e.target.value) || 0 }))}
              className="w-28 rounded-lg border border-charcoal/15 px-2 py-1 text-sm"
            />
            <button onClick={() => onSaveClass(c.category, prices[c.category] ?? 0)} disabled={busy} className="btn-dark px-3 py-1 text-xs">
              {pick(t.pricing.save)}
            </button>
          </div>
        ))}
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
  onSave: (payload: VehicleRow) => void;
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
        <button onClick={() => onSave(f)} disabled={busy} className="btn-dark px-4 py-2 text-xs">
          {busy ? "…" : pick(t.pricing.save)}
        </button>
      </div>
    </div>
  );
}

interface NewVehiclePayload {
  category: string; nameEn: string; nameAr: string; maxPassengers: number;
  exampleModels: string; descriptionEn: string; descriptionAr: string;
  isRecommended: boolean; sortOrder: number; active: boolean;
}

/** Create a brand-new vehicle class. The code is the stable key (e.g. LUXURY_SUV). */
function NewVehicleClass({ onCreate, busy }: { onCreate: (p: NewVehiclePayload) => void; busy: boolean }) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ category: "", nameEn: "", nameAr: "", maxPassengers: 4 });
  const canSave = /^[A-Za-z0-9_]{2,30}$/.test(f.category) && f.nameEn.trim() !== "" && f.nameAr.trim() !== "";

  function create() {
    if (!canSave) return;
    onCreate({
      category: f.category.toUpperCase(),
      nameEn: f.nameEn,
      nameAr: f.nameAr,
      maxPassengers: f.maxPassengers,
      exampleModels: "",
      descriptionEn: "",
      descriptionAr: "",
      isRecommended: false,
      sortOrder: 99,
      active: true,
    });
    setF({ category: "", nameEn: "", nameAr: "", maxPassengers: 4 });
    setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-gold px-4 py-2 text-xs">
        + {locale === "ar" ? "إضافة فئة مركبة جديدة" : "Add a new vehicle class"}
      </button>
    );
  }

  return (
    <div className="luxe-card p-4">
      <p className="mb-3 font-medium text-charcoal">{locale === "ar" ? "فئة مركبة جديدة" : "New vehicle class"}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الرمز (مثل LUXURY_SUV)" : "Code (e.g. LUXURY_SUV)"}</span>
          <input className="field-input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value.toUpperCase() })} placeholder="LUXURY_SUV" />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الحد الأقصى للركاب" : "Max passengers"}</span>
          <input type="number" min={1} className="field-input" value={f.maxPassengers} onChange={(e) => setF({ ...f, maxPassengers: parseInt(e.target.value) || 1 })} />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الاسم (EN)" : "Name (EN)"}</span>
          <input className="field-input" value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الاسم (AR)" : "Name (AR)"}</span>
          <input className="field-input" value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} />
        </label>
      </div>
      <p className="mt-2 text-xs text-charcoal/45">
        {locale === "ar"
          ? "بعد الإنشاء، حدّد سعر كل خدمة لهذه الفئة من تبويب الخدمات."
          : "After creating, set this class's price for each service in the Services tab."}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={create} disabled={busy || !canSave} className="btn-dark px-4 py-2 text-xs">
          {busy ? "…" : (locale === "ar" ? "إنشاء" : "Create")}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost px-4 py-2 text-xs">
          {locale === "ar" ? "إلغاء" : "Cancel"}
        </button>
        <span className="text-xs text-charcoal/45">{locale === "ar" ? "يمكنك تعديل باقي التفاصيل بعد الإنشاء." : "You can edit the rest of the details after creating."}</span>
      </div>
    </div>
  );
}
