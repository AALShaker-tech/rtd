"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { deleteServiceStep, upsertServiceStep } from "@/server/actions/service.actions";

export interface ServiceRow {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  shortNameEn: string;
  shortNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder: number;
  cityScope: "RIYADH" | "DESTINATION" | "ANY";
  featTransfer: boolean;
  featAssistance: boolean;
  featFlight: boolean;
  featHotel: boolean;
  featHome: boolean;
  featChauffeur: boolean;
  createsDriverTask: boolean;
  active: boolean;
}

const BLANK: Omit<ServiceRow, "id"> = {
  code: "", nameEn: "", nameAr: "", shortNameEn: "", shortNameAr: "",
  descriptionEn: "", descriptionAr: "", sortOrder: 99, cityScope: "DESTINATION",
  featTransfer: false, featAssistance: false, featFlight: false, featHotel: false,
  featHome: false, featChauffeur: false, createsDriverTask: false, active: true,
};

export function ServicesManager({ services }: { services: ServiceRow[] }) {
  const { locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(payload: Omit<ServiceRow, "id"> & { id?: string }, key: string) {
    setBusy(key);
    setError(null);
    // An empty id means this is a built-in fallback row not yet persisted, or a
    // brand-new service → create (upsert by code).
    const { id, ...rest } = payload;
    const res = await upsertServiceStep(id ? payload : rest);
    setBusy(null);
    if (!res.ok) { setError(res.error); return; }
    setCreating(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(ar ? "حذف هذه الخدمة؟ لن تظهر في الحجوزات الجديدة." : "Delete this service? It will no longer appear in new bookings.")) return;
    setBusy(id);
    setError(null);
    const res = await deleteServiceStep(id);
    setBusy(null);
    if (!res.ok) { setError(res.error); return; }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">{ar ? "الخدمات" : "Services"}</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            {ar
              ? "الخدمات التي يبنى منها العميل رحلته، وترتيبها وسلوكها."
              : "The services a customer assembles into a journey — their order and behaviour."}
          </p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-gold px-4 py-2 text-xs">
            + {ar ? "خدمة جديدة" : "New service"}
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {creating && (
        <ServiceEditor
          svc={{ id: "", ...BLANK }}
          isNew
          busy={busy === "new"}
          onSave={(p) => save(p, "new")}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="space-y-3">
        {services.map((s) => (
          <ServiceEditor
            key={s.id}
            svc={s}
            busy={busy === s.id}
            onSave={(payload) => save({ ...payload, id: s.id }, s.id)}
            onDelete={() => remove(s.id)}
          />
        ))}
      </div>
    </div>
  );
}

const FEATURES: { key: keyof Pick<ServiceRow, "featTransfer" | "featAssistance" | "featFlight" | "featHotel" | "featHome" | "featChauffeur">; en: string; ar: string }[] = [
  { key: "featTransfer", en: "Car transfer", ar: "نقل بسيارة" },
  { key: "featChauffeur", en: "Chauffeur (by day)", ar: "سائق (باليوم)" },
  { key: "featAssistance", en: "Airport assistance", ar: "استقبال بالمطار" },
  { key: "featFlight", en: "Flight details", ar: "تفاصيل الرحلة" },
  { key: "featHotel", en: "Hotel field", ar: "حقل الفندق" },
  { key: "featHome", en: "Home address", ar: "عنوان المنزل" },
];

function ServiceEditor({
  svc,
  isNew,
  busy,
  onSave,
  onDelete,
  onCancel,
}: {
  svc: ServiceRow;
  isNew?: boolean;
  busy: boolean;
  onSave: (p: Omit<ServiceRow, "id">) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [f, setF] = useState(svc);
  const [open, setOpen] = useState(!!isNew);
  const set = <K extends keyof ServiceRow>(key: K, value: ServiceRow[K]) => setF((s) => ({ ...s, [key]: value }));
  const canSave = f.code.trim() !== "" && f.nameEn.trim() !== "" && f.nameAr.trim() !== "" && f.shortNameEn.trim() !== "" && f.shortNameAr.trim() !== "";

  return (
    <div className="luxe-card p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-start">
        <span className="flex items-center gap-3">
          <span className="grid h-6 w-6 place-items-center rounded bg-charcoal/5 text-[0.65rem] font-bold text-charcoal/60">{f.sortOrder}</span>
          <span>
            <span className="font-medium text-charcoal">{isNew ? (ar ? "خدمة جديدة" : "New service") : (ar ? f.nameAr : f.nameEn)}</span>
            {!isNew && <span className="ms-2 font-mono text-[0.7rem] text-charcoal/40">{f.code}</span>}
          </span>
        </span>
        <span className="flex items-center gap-3">
          {!f.active && <span className="badge bg-charcoal/10 text-charcoal/50">{ar ? "معطّلة" : "Off"}</span>}
          <span className="text-charcoal/40">{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-charcoal/5 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">{ar ? "الرمز (UPPER_SNAKE)" : "Code (UPPER_SNAKE)"}</span>
              <input className="field-input font-mono" value={f.code} disabled={!isNew} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))} />
              {!isNew && <span className="mt-1 block text-[0.68rem] text-charcoal/40">{ar ? "لا يمكن تغيير الرمز بعد الإنشاء" : "Code can't change after creation"}</span>}
            </label>
            <label className="block">
              <span className="field-label">{ar ? "الترتيب (1-5 ذهاب، 6-10 عودة)" : "Order (1-5 departure, 6-10 return)"}</span>
              <input type="number" min={0} max={999} className="field-input" value={f.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} />
            </label>
            <label className="block">
              <span className="field-label">{ar ? "الاسم (EN)" : "Name (EN)"}</span>
              <input className="field-input" value={f.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
            </label>
            <label className="block">
              <span className="field-label">{ar ? "الاسم (AR)" : "Name (AR)"}</span>
              <input className="field-input" value={f.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
            </label>
            <label className="block">
              <span className="field-label">{ar ? "اسم مختصر (EN)" : "Short name (EN)"}</span>
              <input className="field-input" value={f.shortNameEn} onChange={(e) => set("shortNameEn", e.target.value)} />
            </label>
            <label className="block">
              <span className="field-label">{ar ? "اسم مختصر (AR)" : "Short name (AR)"}</span>
              <input className="field-input" value={f.shortNameAr} onChange={(e) => set("shortNameAr", e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">{ar ? "الوصف (EN)" : "Description (EN)"}</span>
              <input className="field-input" value={f.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">{ar ? "الوصف (AR)" : "Description (AR)"}</span>
              <input className="field-input" value={f.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} />
            </label>
            <label className="block">
              <span className="field-label">{ar ? "نطاق المدينة" : "City scope"}</span>
              <select className="field-input" value={f.cityScope} onChange={(e) => set("cityScope", e.target.value as ServiceRow["cityScope"])}>
                <option value="RIYADH">{ar ? "الرياض فقط" : "Riyadh only"}</option>
                <option value="DESTINATION">{ar ? "مدينة الوجهة" : "Destination city"}</option>
                <option value="ANY">{ar ? "أي مدينة" : "Any city"}</option>
              </select>
            </label>
          </div>

          <div>
            <span className="field-label">{ar ? "السلوك" : "Behaviour"}</span>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {FEATURES.map((feat) => (
                <label key={feat.key} className="flex items-center gap-2 text-sm text-charcoal/70">
                  <input type="checkbox" checked={f[feat.key]} onChange={(e) => set(feat.key, e.target.checked)} className="h-4 w-4 accent-gold" />
                  {ar ? feat.ar : feat.en}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-charcoal/70">
              <input type="checkbox" checked={f.createsDriverTask} onChange={(e) => set("createsDriverTask", e.target.checked)} className="h-4 w-4 accent-gold" />
              {ar ? "ينشئ مهمة سائق" : "Creates a driver task"}
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal/70">
              <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-gold" />
              {ar ? "مفعّلة" : "Active"}
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            {onDelete && (
              <button onClick={onDelete} disabled={busy} className="btn-ghost px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                {ar ? "حذف" : "Delete"}
              </button>
            )}
            {onCancel && (
              <button onClick={onCancel} className="btn-ghost px-3 py-2 text-xs">{ar ? "إلغاء" : "Cancel"}</button>
            )}
            <button
              onClick={() => { const { id: _id, ...rest } = f; void _id; onSave(rest); }}
              disabled={busy || !canSave}
              className="btn-dark px-4 py-2 text-xs"
            >
              {busy ? "…" : ar ? "حفظ" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
