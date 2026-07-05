"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { deletePackage, upsertPackage } from "@/server/actions/package.actions";

interface PackageRow {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  featured: boolean;
  sortOrder: number;
  active: boolean;
}

const BLANK: Omit<PackageRow, "id"> = {
  nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "", price: 0, featured: false, sortOrder: 99, active: true,
};

export function PackagesManager({ packages }: { packages: PackageRow[] }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function save(payload: Partial<PackageRow> & Omit<PackageRow, "id">, key: string) {
    setBusy(key);
    await upsertPackage(payload);
    setBusy(null);
    setCreating(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(locale === "ar" ? "حذف هذه الباقة؟" : "Delete this package?")) return;
    setBusy(id);
    await deletePackage(id);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.packages.title)}</h1>
          <p className="mt-1 text-sm text-charcoal/55">{pick(t.packages.subtitle)}</p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-gold px-4 py-2 text-xs">
            + {locale === "ar" ? "باقة جديدة" : "New package"}
          </button>
        )}
      </div>

      {creating && (
        <PackageEditor
          pkg={{ id: "", ...BLANK }}
          isNew
          busy={busy === "new"}
          onSave={(p) => save(p, "new")}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {packages.map((p) => (
          <PackageEditor
            key={p.id}
            pkg={p}
            busy={busy === p.id}
            onSave={(payload) => save({ ...payload, id: p.id }, p.id)}
            onDelete={() => remove(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PackageEditor({
  pkg,
  isNew,
  busy,
  onSave,
  onDelete,
  onCancel,
}: {
  pkg: PackageRow;
  isNew?: boolean;
  busy: boolean;
  onSave: (p: Omit<PackageRow, "id">) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const { locale } = useI18n();
  const [f, setF] = useState(pkg);
  const set = <K extends keyof PackageRow>(key: K, value: PackageRow[K]) => setF((s) => ({ ...s, [key]: value }));
  const canSave = f.nameEn.trim() !== "" && f.nameAr.trim() !== "";

  return (
    <div className="luxe-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-charcoal">{isNew ? (locale === "ar" ? "باقة جديدة" : "New package") : pkg.nameEn}</p>
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
          <span className="field-label">{locale === "ar" ? "السعر (ريال)" : "Price (SAR)"}</span>
          <input type="number" min={0} step={50} className="field-input" value={f.price} onChange={(e) => set("price", parseInt(e.target.value) || 0)} />
        </label>
        <label className="block">
          <span className="field-label">{locale === "ar" ? "الترتيب" : "Sort order"}</span>
          <input type="number" min={0} className="field-input" value={f.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {onDelete && (
          <button onClick={onDelete} disabled={busy} className="btn-ghost px-3 py-2 text-xs text-red-600 hover:bg-red-50">
            {locale === "ar" ? "حذف" : "Delete"}
          </button>
        )}
        {onCancel && (
          <button onClick={onCancel} className="btn-ghost px-3 py-2 text-xs">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
        )}
        <button
          onClick={() => onSave({ nameEn: f.nameEn, nameAr: f.nameAr, descriptionEn: f.descriptionEn, descriptionAr: f.descriptionAr, price: f.price, featured: f.featured, sortOrder: f.sortOrder, active: f.active })}
          disabled={busy || !canSave}
          className="btn-dark px-4 py-2 text-xs"
        >
          {busy ? "…" : locale === "ar" ? "حفظ" : "Save"}
        </button>
      </div>
    </div>
  );
}
