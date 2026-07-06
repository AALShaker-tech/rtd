"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { updateVehicle } from "@/server/actions/pricing.actions";

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

export function VehiclesManager({ vehicles }: { vehicles: VehicleRow[] }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const ar = locale === "ar";

  async function run(key: string, fn: () => Promise<unknown>) {
    setSaving(key);
    await fn();
    setSaving(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.pricing.vehiclePricing)}</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          {ar
            ? "عرّف فئات السيارات وسعاتها. تُحدَّد الأسعار لكل مدينة من صفحة المدن."
            : "Define the vehicle classes and their capacity. Prices are set per city on the Cities page."}
        </p>
      </div>

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
  );
}

/** Full editor for one vehicle category (names, capacity, models, flags). */
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
          ? "بعد الإنشاء، حدّد سعر هذه الفئة لكل خدمة من صفحة المدن."
          : "After creating, set this class's price for each service on the Cities page."}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={create} disabled={busy || !canSave} className="btn-dark px-4 py-2 text-xs">
          {busy ? "…" : (locale === "ar" ? "إنشاء" : "Create")}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost px-4 py-2 text-xs">
          {locale === "ar" ? "إلغاء" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
