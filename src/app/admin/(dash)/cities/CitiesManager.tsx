"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { STEPS, LOUNGE_TYPES, VEHICLES, DEFAULT_SERVICE_PRICES, DEFAULT_LOUNGE_PRICES, getStep } from "@/lib/domain";
import { FieldWrap, TextInput, Select } from "@/components/ui/Field";
import {
  setCityActive,
  setCityLoungePrice,
  setCityServicePrice,
  setCityVehiclePrice,
  upsertAirport,
  upsertCity,
} from "@/server/actions/city.actions";

interface AirportRow { code: string; nameEn: string; nameAr: string; terminals: string[]; timezone: string | null; utcOffsetMinutes: number }
interface ServiceRow { stepType: string; price: number | null; enabled: boolean }
interface LoungeRow { loungeType: string; price: number | null; enabled: boolean }
interface VehicleRow { category: string; multiplier: number | null; enabled: boolean }
interface CityRow {
  code: string; nameEn: string; nameAr: string; country: string; active: boolean; isOrigin: boolean;
  multiplier: number; currency: string | null; approxDurationMinutes: number | null; notes: string | null;
  airports: AirportRow[]; servicePricing: ServiceRow[]; loungePricing: LoungeRow[]; vehiclePricing: VehicleRow[];
}

const EMPTY: CityRow = { code: "", nameEn: "", nameAr: "", country: "", active: true, isOrigin: false, multiplier: 1, currency: null, approxDurationMinutes: null, notes: null, airports: [], servicePricing: [], loungePricing: [], vehiclePricing: [] };

export function CitiesManager({ cities }: { cities: CityRow[] }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(cities[0]?.code ?? null);
  const [adding, setAdding] = useState(false);

  const city = adding ? EMPTY : cities.find((c) => c.code === selected) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.cities.title)}</h1>
        <p className="mt-1 text-sm text-charcoal/55">{pick(t.cities.subtitle)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* City list */}
        <div className="space-y-2">
          <button onClick={() => { setAdding(true); setSelected(null); }} className="btn-gold w-full text-xs">+ {pick(t.cities.addCity)}</button>
          {cities.map((c) => (
            <button
              key={c.code}
              onClick={() => { setAdding(false); setSelected(c.code); }}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-start text-sm transition ${selected === c.code && !adding ? "border-gold bg-gold-50" : "border-charcoal/10 bg-white hover:border-gold/40"}`}
            >
              <span>
                <span className="font-medium text-charcoal">{locale === "ar" ? c.nameAr : c.nameEn}</span>
                <span className="ms-2 text-xs text-charcoal/40">{c.code}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-charcoal/50">×{c.multiplier}</span>
                <span className={`h-2 w-2 rounded-full ${c.active ? "bg-emerald-500" : "bg-charcoal/20"}`} />
              </span>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div>
          {city ? (
            <CityEditor key={adding ? "__new" : city.code} city={city} isNew={adding} onSaved={() => { setAdding(false); router.refresh(); }} />
          ) : (
            <div className="luxe-card p-10 text-center text-sm text-charcoal/40">{pick(t.cities.selectCity)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CityEditor({ city, isNew, onSaved }: { city: CityRow; isNew: boolean; onSaved: () => void }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    code: city.code, nameEn: city.nameEn, nameAr: city.nameAr, country: city.country,
    multiplier: String(city.multiplier), currency: city.currency ?? "", approxDurationMinutes: city.approxDurationMinutes != null ? String(city.approxDurationMinutes) : "",
    notes: city.notes ?? "", isOrigin: city.isOrigin,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function saveCity() {
    setBusy(true); setError(undefined);
    const res = await upsertCity({
      code: form.code, nameEn: form.nameEn, nameAr: form.nameAr, country: form.country,
      // Active is toggled only via the explicit Enable/Disable button (a single
      // source of truth); saving details must never silently flip it. New cities
      // default to active.
      active: city.active, isOrigin: form.isOrigin, multiplier: parseFloat(form.multiplier) || 0,
      currency: form.currency || undefined, approxDurationMinutes: form.approxDurationMinutes ? parseInt(form.approxDurationMinutes) : undefined,
      notes: form.notes || undefined,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onSaved();
  }

  return (
    <div className="space-y-6">
      {/* City details */}
      <div className="luxe-card p-5">
        <h3 className="mb-4 font-serif text-lg font-semibold text-charcoal">{pick(t.cities.cityDetails)}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label={pick(t.cities.cityCode)}>
            <TextInput value={form.code} disabled={!isNew} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="LON" />
          </FieldWrap>
          <FieldWrap label={pick(t.cities.country)}>
            <TextInput value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} placeholder="GB" />
          </FieldWrap>
          <FieldWrap label={pick(t.cities.nameEn)}>
            <TextInput value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
          </FieldWrap>
          <FieldWrap label={pick(t.cities.nameAr)}>
            <TextInput value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          </FieldWrap>
          <FieldWrap label={pick(t.cities.multiplier)}>
            <TextInput type="number" step={0.05} min={0} value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} />
          </FieldWrap>
          <FieldWrap label={pick(t.cities.duration)}>
            <TextInput type="number" min={0} value={form.approxDurationMinutes} onChange={(e) => setForm({ ...form, approxDurationMinutes: e.target.value })} />
          </FieldWrap>
          <FieldWrap label={pick(t.cities.currency)}>
            <TextInput value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="SAR" />
          </FieldWrap>
          <FieldWrap label={pick(t.cities.notes)}>
            <TextInput value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FieldWrap>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm text-charcoal/70"><input type="checkbox" className="h-4 w-4 accent-gold" checked={form.isOrigin} onChange={(e) => setForm({ ...form, isOrigin: e.target.checked })} />{pick(t.cities.isOrigin)}</label>
          {!isNew && (
            <span className="flex items-center gap-2 text-sm text-charcoal/70">
              <span className={`h-2 w-2 rounded-full ${city.active ? "bg-emerald-500" : "bg-charcoal/25"}`} />
              {city.active ? pick(t.cities.active) : (locale === "ar" ? "معطّلة" : "Disabled")}
              <button onClick={async () => { await setCityActive(city.code, !city.active); router.refresh(); }} className="btn-ghost px-3 py-1.5 text-xs">
                {city.active ? (locale === "ar" ? "تعطيل" : "Disable") : (locale === "ar" ? "تفعيل" : "Enable")}
              </button>
            </span>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button onClick={saveCity} disabled={busy} className="btn-gold ms-auto px-5 py-2 text-xs">{pick(t.pricing.save)}</button>
        </div>
      </div>

      {isNew ? (
        <p className="text-sm text-charcoal/50">{locale === "ar" ? "احفظ المدينة أولًا لإضافة المطارات والأسعار." : "Save the city first to add airports and prices."}</p>
      ) : (
        <>
          <AirportEditor cityCode={city.code} airports={city.airports} />
          <ServicePrices cityCode={city.code} rows={city.servicePricing} />
          <VehiclePrices cityCode={city.code} rows={city.vehiclePricing} />
          <LoungePrices cityCode={city.code} rows={city.loungePricing} />
        </>
      )}
    </div>
  );
}

function AirportEditor({ cityCode, airports }: { cityCode: string; airports: AirportRow[] }) {
  const { t, pick } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({ code: "", nameEn: "", nameAr: "", terminals: "", timezone: "", utcOffsetMinutes: "0" });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await upsertAirport({ code: form.code, cityCode, nameEn: form.nameEn, nameAr: form.nameAr, terminals: form.terminals.split(",").map((x) => x.trim()).filter(Boolean), timezone: form.timezone || undefined, utcOffsetMinutes: parseInt(form.utcOffsetMinutes) || 0 });
    setBusy(false);
    setForm({ code: "", nameEn: "", nameAr: "", terminals: "", timezone: "", utcOffsetMinutes: "0" });
    router.refresh();
  }

  function edit(a: AirportRow) {
    setForm({ code: a.code, nameEn: a.nameEn, nameAr: a.nameAr, terminals: a.terminals.join(", "), timezone: a.timezone ?? "", utcOffsetMinutes: String(a.utcOffsetMinutes) });
  }

  return (
    <div className="luxe-card p-5">
      <h3 className="mb-4 font-serif text-lg font-semibold text-charcoal">{pick(t.cities.airports)}</h3>
      <div className="mb-3 flex flex-wrap gap-2">
        {airports.map((a) => (
          <button key={a.code} onClick={() => edit(a)} className="badge bg-charcoal/5 text-charcoal/70 hover:bg-gold-50">{a.code} · {a.nameEn}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldWrap label={pick(t.cities.airportCode)}><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="LHR" /></FieldWrap>
        <FieldWrap label={pick(t.cities.nameEn)}><TextInput value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></FieldWrap>
        <FieldWrap label={pick(t.cities.nameAr)}><TextInput value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></FieldWrap>
        <FieldWrap label={pick(t.cities.terminals)}><TextInput value={form.terminals} onChange={(e) => setForm({ ...form, terminals: e.target.value })} placeholder="T2, T3, T5" /></FieldWrap>
        <FieldWrap label={pick(t.cities.timezone)}><TextInput value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Europe/London" /></FieldWrap>
        <FieldWrap label="UTC offset (min)"><TextInput type="number" value={form.utcOffsetMinutes} onChange={(e) => setForm({ ...form, utcOffsetMinutes: e.target.value })} /></FieldWrap>
      </div>
      <button onClick={save} disabled={busy || !form.code} className="btn-dark mt-3 px-4 py-2 text-xs">{pick(t.cities.addAirport)}</button>
    </div>
  );
}

function ServicePrices({ cityCode, rows }: { cityCode: string; rows: ServiceRow[] }) {
  const { t, pick, locale } = useI18n();
  return (
    <div className="luxe-card p-5">
      <h3 className="font-serif text-lg font-semibold text-charcoal">{pick(t.cities.servicePrices)}</h3>
      <p className="mb-3 text-xs text-charcoal/45">{pick(t.cities.overrideHint)}</p>
      <div className="grid gap-2">
        {STEPS.map((s) => {
          const row = rows.find((r) => r.stepType === s.type);
          return (
            <PriceRow
              key={s.type}
              label={pick(getStep(s.type).name)}
              fallback={DEFAULT_SERVICE_PRICES[s.type]}
              price={row?.price ?? null}
              enabled={row?.enabled ?? true}
              onSave={(price, enabled) => setCityServicePrice(cityCode, s.type, price, enabled)}
            />
          );
        })}
      </div>
    </div>
  );
}

function LoungePrices({ cityCode, rows }: { cityCode: string; rows: LoungeRow[] }) {
  const { t, pick, locale } = useI18n();
  return (
    <div className="luxe-card p-5">
      <h3 className="font-serif text-lg font-semibold text-charcoal">{pick(t.cities.loungePrices)}</h3>
      <p className="mb-3 text-xs text-charcoal/45">{pick(t.cities.overrideHint)}</p>
      <div className="grid gap-2">
        {LOUNGE_TYPES.map((l) => {
          const row = rows.find((r) => r.loungeType === l.value);
          return (
            <PriceRow
              key={l.value}
              label={l.name[locale]}
              fallback={DEFAULT_LOUNGE_PRICES[l.value]}
              price={row?.price ?? null}
              enabled={row?.enabled ?? true}
              onSave={(price, enabled) => setCityLoungePrice(cityCode, l.value, price, enabled)}
            />
          );
        })}
      </div>
    </div>
  );
}

function PriceRow({ label, fallback, price, enabled, onSave }: { label: string; fallback?: number; price: number | null; enabled: boolean; onSave: (price: number | null, enabled: boolean) => Promise<unknown> }) {
  const { t, pick } = useI18n();
  const router = useRouter();
  const [val, setVal] = useState(price != null ? String(price) : "");
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave(val.trim() === "" ? null : parseInt(val) || 0, on);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-charcoal/10 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-charcoal/80">{label}</span>
      <input
        type="number" min={0} value={val} onChange={(e) => setVal(e.target.value)}
        placeholder={fallback != null ? `${fallback}` : pick(t.cities.overridePlaceholder)}
        className="w-24 rounded-lg border border-charcoal/15 px-2 py-1 text-sm"
      />
      <label className="flex items-center gap-1 text-xs text-charcoal/60">
        <input type="checkbox" className="h-4 w-4 accent-gold" checked={on} onChange={(e) => setOn(e.target.checked)} />{pick(t.cities.enabled)}
      </label>
      <button onClick={save} disabled={busy} className="btn-dark px-3 py-1 text-xs">{pick(t.pricing.save)}</button>
    </div>
  );
}

function VehiclePrices({ cityCode, rows }: { cityCode: string; rows: VehicleRow[] }) {
  const { pick, locale } = useI18n();
  return (
    <div className="luxe-card p-5">
      <h3 className="font-serif text-lg font-semibold text-charcoal">
        {locale === "ar" ? "أسعار المركبات (مضاعف لكل مدينة)" : "Vehicle prices (per-city multiplier)"}
      </h3>
      <p className="mb-3 text-xs text-charcoal/45">
        {locale === "ar"
          ? "اتركه فارغًا لاستخدام المضاعف العام. ألغِ التفعيل لإخفاء الفئة في هذه المدينة."
          : "Leave blank to use the global multiplier. Uncheck to hide the class in this city."}
      </p>
      <div className="grid gap-2">
        {VEHICLES.map((v) => {
          const row = rows.find((r) => r.category === v.category);
          return (
            <VehiclePriceRow
              key={v.category}
              label={v.category}
              fallback={v.multiplier}
              multiplier={row?.multiplier ?? null}
              enabled={row?.enabled ?? true}
              onSave={(mult, enabled) => setCityVehiclePrice(cityCode, v.category, mult, enabled)}
            />
          );
        })}
      </div>
    </div>
  );
}

function VehiclePriceRow({ label, fallback, multiplier, enabled, onSave }: { label: string; fallback?: number; multiplier: number | null; enabled: boolean; onSave: (multiplier: number | null, enabled: boolean) => Promise<unknown> }) {
  const { t, pick } = useI18n();
  const router = useRouter();
  const [val, setVal] = useState(multiplier != null ? String(multiplier) : "");
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave(val.trim() === "" ? null : parseFloat(val) || 0, on);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-charcoal/10 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-charcoal/80">{label}</span>
      <input
        type="number" step={0.1} min={0} value={val} onChange={(e) => setVal(e.target.value)}
        placeholder={fallback != null ? `×${fallback}` : "×"}
        className="w-24 rounded-lg border border-charcoal/15 px-2 py-1 text-sm"
      />
      <label className="flex items-center gap-1 text-xs text-charcoal/60">
        <input type="checkbox" className="h-4 w-4 accent-gold" checked={on} onChange={(e) => setOn(e.target.checked)} />{pick(t.cities.enabled)}
      </label>
      <button onClick={save} disabled={busy} className="btn-dark px-3 py-1 text-xs">{pick(t.pricing.save)}</button>
    </div>
  );
}
