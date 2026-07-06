"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { deleteLounge, upsertLounge } from "@/server/actions/lounge.actions";

export interface LoungeRow {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder: number;
  active: boolean;
}

const BLANK: Omit<LoungeRow, "id"> = {
  nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "", sortOrder: 99, active: true,
};

export function LoungesManager({ lounges }: { lounges: LoungeRow[] }) {
  const { locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(payload: Omit<LoungeRow, "id"> & { id?: string }, key: string) {
    setBusy(key);
    setError(null);
    const res = await upsertLounge(payload);
    setBusy(null);
    if (!res.ok) { setError(res.error); return; }
    setCreating(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(ar ? "حذف هذه الصالة؟ ستُزال من كل المطارات." : "Delete this lounge? It will be removed from all airports.")) return;
    setBusy(id);
    await deleteLounge(id);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">{ar ? "الصالات" : "Lounges"}</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            {ar
              ? "صالات المطار وخدمات الاستقبال. فعّلها وحدّد سعرها لكل مطار من صفحة المدن."
              : "Airport lounges & assistance. Enable them and set prices per airport on the Cities page."}
          </p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-gold px-4 py-2 text-xs">
            + {ar ? "صالة جديدة" : "New lounge"}
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {creating && (
        <LoungeEditor
          lounge={{ id: "", ...BLANK }}
          isNew
          busy={busy === "new"}
          onSave={(p) => save(p, "new")}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {lounges.map((l) => (
          <LoungeEditor
            key={l.id}
            lounge={l}
            busy={busy === l.id}
            onSave={(payload) => save({ ...payload, id: l.id }, l.id)}
            onDelete={() => remove(l.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LoungeEditor({
  lounge,
  isNew,
  busy,
  onSave,
  onDelete,
  onCancel,
}: {
  lounge: LoungeRow;
  isNew?: boolean;
  busy: boolean;
  onSave: (p: Omit<LoungeRow, "id">) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [f, setF] = useState(lounge);
  const set = <K extends keyof LoungeRow>(key: K, value: LoungeRow[K]) => setF((s) => ({ ...s, [key]: value }));
  const canSave = f.nameEn.trim() !== "" && f.nameAr.trim() !== "";

  return (
    <div className="luxe-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-charcoal">{isNew ? (ar ? "صالة جديدة" : "New lounge") : (ar ? f.nameAr : f.nameEn)}</p>
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-gold" />
          {ar ? "مفعّلة" : "Active"}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">{ar ? "الاسم (EN)" : "Name (EN)"}</span>
          <input className="field-input" value={f.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">{ar ? "الاسم (AR)" : "Name (AR)"}</span>
          <input className="field-input" value={f.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">{ar ? "الوصف: الخدمات والمتطلبات (EN)" : "Description: services & requirements (EN)"}</span>
          <textarea className="field-input min-h-[70px]" value={f.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">{ar ? "الوصف: الخدمات والمتطلبات (AR)" : "Description: services & requirements (AR)"}</span>
          <textarea className="field-input min-h-[70px]" value={f.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">{ar ? "الترتيب" : "Sort order"}</span>
          <input type="number" min={0} className="field-input" value={f.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {onDelete && (
          <button onClick={onDelete} disabled={busy} className="btn-ghost px-3 py-2 text-xs text-red-600 hover:bg-red-50">
            {ar ? "حذف" : "Delete"}
          </button>
        )}
        {onCancel && (
          <button onClick={onCancel} className="btn-ghost px-3 py-2 text-xs">{ar ? "إلغاء" : "Cancel"}</button>
        )}
        <button
          onClick={() => onSave({ nameEn: f.nameEn, nameAr: f.nameAr, descriptionEn: f.descriptionEn, descriptionAr: f.descriptionAr, sortOrder: f.sortOrder, active: f.active })}
          disabled={busy || !canSave}
          className="btn-dark px-4 py-2 text-xs"
        >
          {busy ? "…" : ar ? "حفظ" : "Save"}
        </button>
      </div>
    </div>
  );
}
