"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { STEPS, getStep } from "@/lib/domain";
import { updatePackage } from "@/server/actions/package.actions";

interface PackageRow {
  type: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  includedSteps: string[];
  featured: boolean;
  sortOrder: number;
  active: boolean;
}

export function PackagesManager({ packages }: { packages: PackageRow[] }) {
  const { t, pick } = useI18n();
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.packages.title)}</h1>
        <p className="mt-1 text-sm text-charcoal/55">{pick(t.packages.subtitle)}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {packages.map((p) => (
          <PackageEditor
            key={p.type}
            pkg={p}
            busy={saving === p.type}
            onSave={async (payload) => {
              setSaving(p.type);
              await updatePackage(payload);
              setSaving(null);
              router.refresh();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PackageEditor({ pkg, busy, onSave }: { pkg: PackageRow; busy: boolean; onSave: (p: PackageRow) => void }) {
  const { pick, locale } = useI18n();
  const [f, setF] = useState(pkg);
  const set = <K extends keyof PackageRow>(key: K, value: PackageRow[K]) => setF((s) => ({ ...s, [key]: value }));
  const toggleStep = (type: string) =>
    setF((s) => ({
      ...s,
      includedSteps: s.includedSteps.includes(type)
        ? s.includedSteps.filter((x) => x !== type)
        : [...s.includedSteps, type],
    }));

  return (
    <div className="luxe-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-charcoal">{pkg.type}</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-charcoal/70">
            <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-gold" />
            {locale === "ar" ? "مميزة" : "Featured"}
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal/70">
            <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-gold" />
            {locale === "ar" ? "مفعّلة" : "Active"}
          </label>
        </div>
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
        <label className="block sm:col-span-2">
          <span className="field-label">{locale === "ar" ? "الوصف (EN)" : "Description (EN)"}</span>
          <input className="field-input" value={f.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">{locale === "ar" ? "الوصف (AR)" : "Description (AR)"}</span>
          <input className="field-input" value={f.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الترتيب" : "Sort order"}</span>
          <input type="number" min={0} className="field-input" value={f.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} />
        </label>
      </div>

      <div className="mt-3">
        <p className="field-label">{locale === "ar" ? "الخدمات المشمولة" : "Included services"}</p>
        <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
          {STEPS.map((s) => (
            <label key={s.type} className="flex items-center gap-2 text-sm text-charcoal/75">
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold"
                checked={f.includedSteps.includes(s.type)}
                onChange={() => toggleStep(s.type)}
              />
              <span className="truncate">{pick(getStep(s.type).shortName)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {f.includedSteps.length === 0 && (
          <span className="text-xs text-red-600">{locale === "ar" ? "اختر خدمة واحدة على الأقل" : "Pick at least one service"}</span>
        )}
        <button onClick={() => onSave(f)} disabled={busy || f.includedSteps.length === 0} className="btn-dark px-4 py-2 text-xs">
          {busy ? "…" : locale === "ar" ? "حفظ" : "Save"}
        </button>
      </div>
    </div>
  );
}
