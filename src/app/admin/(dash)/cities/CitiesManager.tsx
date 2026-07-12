"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { FieldWrap, TextInput, Select } from "@/components/ui/Field";
import { CityLandmark, LANDMARK_PRESETS } from "@/components/ui/CityLandmark";
import { PRICE_KEY_LABELS } from "@/lib/domain";
import {
  deleteAirport,
  deleteCity,
  setAirportActive,
  setCityActive,
  setCityServiceClassPrice,
  setCityVehicleEnabled,
  upsertAirport,
  upsertCity,
} from "@/server/actions/city.actions";
import { setAirportLounge } from "@/server/actions/lounge.actions";

interface AirportLoungeRow { loungeId: string; enabled: boolean; price: number; priceMode: "PER_PERSON" | "GROUP"; groupCapacity: number | null }
interface AirportRow { code: string; nameEn: string; nameAr: string; terminals: string[]; timezone: string | null; utcOffsetMinutes: number; active: boolean; lounges: AirportLoungeRow[] }
interface ServiceRow { stepType: string; price: number | null; enabled: boolean }
interface LoungeRow { loungeType: string; price: number | null; enabled: boolean }
interface VehicleRow { category: string; enabled: boolean }
interface ClassPriceRow { stepType: string; category: string; price: number }
interface CityRow {
  code: string; nameEn: string; nameAr: string; country: string; active: boolean; isOrigin: boolean;
  multiplier: number; currency: string | null; approxDurationMinutes: number | null; notes: string | null; landmarkKey: string | null;
  airports: AirportRow[]; servicePricing: ServiceRow[]; loungePricing: LoungeRow[]; vehiclePricing: VehicleRow[];
  serviceClassPricing: ClassPriceRow[];
}

const EMPTY: CityRow = { code: "", nameEn: "", nameAr: "", country: "", active: true, isOrigin: false, multiplier: 1, currency: null, approxDurationMinutes: null, notes: null, landmarkKey: null, airports: [], servicePricing: [], loungePricing: [], vehiclePricing: [], serviceClassPricing: [] };

interface VehicleOption { category: string; nameEn: string }
interface LoungeOption { id: string; nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string }

export function CitiesManager({ cities, vehicles, lounges }: { cities: CityRow[]; vehicles: VehicleOption[]; lounges: LoungeOption[] }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(cities[0]?.code ?? null);
  const [adding, setAdding] = useState(false);

  const city = adding ? EMPTY : cities.find((c) => c.code === selected) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.cities.nav)}</h1>
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
                <span className={`h-2 w-2 rounded-full ${c.active ? "bg-emerald-500" : "bg-charcoal/20"}`} />
              </span>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div>
          {city ? (
            <CityEditor key={adding ? "__new" : city.code} city={city} vehicles={vehicles} lounges={lounges} isNew={adding} onSaved={() => { setAdding(false); router.refresh(); }} onDeleted={() => { setSelected(null); router.refresh(); }} />
          ) : (
            <div className="luxe-card p-10 text-center text-sm text-charcoal/40">{pick(t.cities.selectCity)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CityEditor({ city, vehicles, lounges, isNew, onSaved, onDeleted }: { city: CityRow; vehicles: VehicleOption[]; lounges: LoungeOption[]; isNew: boolean; onSaved: () => void; onDeleted: () => void }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    code: city.code, nameEn: city.nameEn, nameAr: city.nameAr, country: city.country,
    currency: city.currency ?? "", approxDurationMinutes: city.approxDurationMinutes != null ? String(city.approxDurationMinutes) : "",
    notes: city.notes ?? "", isOrigin: city.isOrigin, landmarkKey: city.landmarkKey ?? "",
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
      active: city.active, isOrigin: form.isOrigin, multiplier: 1, // multiplier retired; kept for schema back-compat
      currency: form.currency || undefined, approxDurationMinutes: form.approxDurationMinutes ? parseInt(form.approxDurationMinutes) : undefined,
      notes: form.notes || undefined, landmarkKey: form.landmarkKey || undefined,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onSaved();
  }

  async function removeCity() {
    if (!window.confirm(pick(t.cities.deleteCityConfirm))) return;
    setBusy(true); setError(undefined);
    const res = await deleteCity(city.code);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onDeleted();
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

        {/* Landmark icon picker */}
        <div className="mt-4">
          <span className="field-label">{pick(t.cities.landmark)}</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {/* Auto — falls back to the city-code default, then a generic monument */}
            <button
              type="button"
              onClick={() => setForm({ ...form, landmarkKey: "" })}
              className={`flex h-16 w-20 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] transition ${form.landmarkKey === "" ? "border-gold bg-gold-50 text-gold-dark" : "border-charcoal/15 text-charcoal/50 hover:border-gold/40"}`}
            >
              <CityLandmark code={form.code} size={22} />
              <span>{pick(t.cities.landmarkAuto)}</span>
            </button>
            {LANDMARK_PRESETS.map((p) => {
              const on = form.landmarkKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  title={pick(p.name)}
                  onClick={() => setForm({ ...form, landmarkKey: p.key })}
                  className={`flex h-16 w-20 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] transition ${on ? "border-gold bg-gold-50 text-gold-dark" : "border-charcoal/15 text-charcoal/50 hover:border-gold/40"}`}
                >
                  <CityLandmark landmarkKey={p.key} size={22} />
                  <span className="max-w-full truncate px-1">{pick(p.name)}</span>
                </button>
              );
            })}
          </div>
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
          {!isNew && !city.isOrigin && (
            <button onClick={removeCity} disabled={busy} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">{pick(t.cities.deleteCity)}</button>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button onClick={saveCity} disabled={busy} className="btn-gold ms-auto px-5 py-2 text-xs">{pick(t.pricing.save)}</button>
        </div>
      </div>

      {isNew ? (
        <p className="text-sm text-charcoal/50">{locale === "ar" ? "احفظ المدينة أولًا لإضافة المطارات والأسعار." : "Save the city first to add airports and prices."}</p>
      ) : (
        <>
          <AirportEditor cityCode={city.code} airports={city.airports} lounges={lounges} />
          <ServicePrices cityCode={city.code} isOrigin={city.isOrigin} classRows={city.serviceClassPricing} vehicles={vehicles} />
          <VehicleAvailability cityCode={city.code} rows={city.vehiclePricing} vehicles={vehicles} />
        </>
      )}
    </div>
  );
}

function AirportEditor({ cityCode, airports, lounges }: { cityCode: string; airports: AirportRow[]; lounges: LoungeOption[] }) {
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
      <div className="mb-3 space-y-1.5">
        {airports.map((a) => (
          <AirportListRow key={a.code} airport={a} onEdit={() => edit(a)} />
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

      {/* Per-airport lounges: enable the ones offered here and set each price. */}
      {airports.length > 0 && (
        <div className="mt-5 space-y-4 border-t border-charcoal/10 pt-4">
          <p className="text-sm font-medium text-charcoal/80">{pick(t.cities.airportLounges)}</p>
          {lounges.length === 0 ? (
            <p className="text-xs text-charcoal/45">{pick(t.cities.noLounges)}</p>
          ) : (
            airports.map((a) => (
              <AirportLounges key={a.code} airport={a} lounges={lounges} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** One airport in the list: edit, enable/disable, or delete it. */
function AirportListRow({ airport, onEdit }: { airport: AirportRow; onEdit: () => void }) {
  const { locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true); setError(null);
    await setAirportActive(airport.code, !airport.active);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(ar ? `حذف المطار ${airport.code}؟` : `Delete airport ${airport.code}?`)) return;
    setBusy(true); setError(null);
    const res = await deleteAirport(airport.code);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    router.refresh();
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${airport.active ? "border-charcoal/10" : "border-charcoal/10 bg-charcoal/[0.03]"}`}>
      <button onClick={onEdit} className="min-w-0 flex-1 text-start text-sm text-charcoal/80 hover:text-gold-dark">
        <span className="font-medium">{airport.code}</span>
        <span className="ms-2 text-charcoal/50">{ar ? airport.nameAr : airport.nameEn}</span>
      </button>
      {!airport.active && <span className="badge bg-charcoal/10 text-charcoal/50">{ar ? "معطّل" : "Disabled"}</span>}
      <button onClick={toggle} disabled={busy} className="btn-ghost px-2.5 py-1 text-xs">
        {airport.active ? (ar ? "تعطيل" : "Disable") : (ar ? "تفعيل" : "Enable")}
      </button>
      <button onClick={remove} disabled={busy} className="btn-ghost px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">
        {ar ? "حذف" : "Delete"}
      </button>
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </div>
  );
}

/**
 * Per-city transfer & chauffeur pricing. Prices are city-owned and keyed by a
 * pricing key (not a directional step), so a transfer price is entered once and
 * applies both directions. Airport-assistance is NOT here — it is priced per
 * airport in the Airports section (each lounge/service carries its own price).
 *
 *   Origin city (Riyadh): Home ⇄ Airport transfer.
 *   Destination city:      Airport ⇄ Hotel transfer + Chauffeur during stay.
 */
function ServicePrices({ cityCode, isOrigin, classRows, vehicles }: { cityCode: string; isOrigin: boolean; classRows: ClassPriceRow[]; vehicles: VehicleOption[] }) {
  const { t, pick, locale } = useI18n();
  const keys = isOrigin
    ? ["HOME_AIRPORT_TRANSFER"]
    : ["AIRPORT_HOTEL_TRANSFER", "CHAUFFEUR_DURING_STAY"];
  return (
    <div className="luxe-card p-5">
      <h3 className="font-serif text-lg font-semibold text-charcoal">{pick(t.cities.servicePrices)}</h3>
      <p className="mb-3 text-xs text-charcoal/45">
        {locale === "ar"
          ? "أسعار التوصيل خاصة بهذه المدينة وتُطبَّق في الاتجاهين. خدمات المطار تُسعَّر ضمن قسم المطارات."
          : "Transfer prices are per city and apply both directions. Airport services are priced in the Airports section."}
      </p>
      <div className="grid gap-2">
        {keys.map((key) => (
          <CityClassPrices
            key={key}
            label={PRICE_KEY_LABELS[key] ? pick(PRICE_KEY_LABELS[key]) : key}
            cityCode={cityCode}
            stepType={key}
            vehicles={vehicles}
            rows={classRows.filter((r) => r.stepType === key)}
          />
        ))}
      </div>
    </div>
  );
}

/** Per-airport lounge availability + price. All active lounges are listed; the
 *  admin enables the ones offered at this airport and sets each price. */
function AirportLounges({ airport, lounges }: { airport: AirportRow; lounges: LoungeOption[] }) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <div className="rounded-lg border border-charcoal/10 px-3 py-2">
      <p className="mb-2 text-sm font-medium text-charcoal/80">{airport.code} · {ar ? airport.nameAr : airport.nameEn}</p>
      <div className="grid gap-1.5">
        {lounges.map((l) => {
          const row = airport.lounges.find((r) => r.loungeId === l.id);
          return (
            <AirportLoungeRowEditor
              key={l.id}
              airportCode={airport.code}
              loungeId={l.id}
              label={ar ? l.nameAr : l.nameEn}
              description={ar ? l.descriptionAr : l.descriptionEn}
              enabled={row?.enabled ?? false}
              price={row?.price ?? 0}
              priceMode={row?.priceMode ?? "PER_PERSON"}
              groupCapacity={row?.groupCapacity ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}

function AirportLoungeRowEditor({ airportCode, loungeId, label, description, enabled, price, priceMode, groupCapacity }: { airportCode: string; loungeId: string; label: string; description: string; enabled: boolean; price: number; priceMode: "PER_PERSON" | "GROUP"; groupCapacity: number | null }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [val, setVal] = useState(String(price));
  const [mode, setMode] = useState<"PER_PERSON" | "GROUP">(priceMode);
  const [cap, setCap] = useState(groupCapacity != null ? String(groupCapacity) : "");
  const [busy, setBusy] = useState(false);

  async function save(nextOn: boolean) {
    setBusy(true);
    await setAirportLounge({
      airportCode,
      loungeId,
      enabled: nextOn,
      price: parseInt(val) || 0,
      priceMode: mode,
      groupCapacity: mode === "GROUP" && cap.trim() !== "" ? parseInt(cap) || null : null,
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-charcoal/10 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-charcoal/80">
          <input type="checkbox" className="h-4 w-4 accent-gold" checked={on} onChange={(e) => { setOn(e.target.checked); }} />
          <span className="truncate">{label}</span>
        </label>
        {/* Per-person multiplies by party size; group is a flat total. */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "PER_PERSON" | "GROUP")}
          className="rounded-lg border border-charcoal/15 px-2 py-1 text-xs"
          title={ar ? "طريقة التسعير" : "Pricing mode"}
        >
          <option value="PER_PERSON">{ar ? "للفرد" : "Per person"}</option>
          <option value="GROUP">{ar ? "للمجموعة" : "Group"}</option>
        </select>
        {mode === "GROUP" && (
          <input
            type="number" min={1} value={cap} onChange={(e) => setCap(e.target.value)}
            placeholder={ar ? "السعة" : "capacity"}
            title={ar ? "عدد الأفراد الذين يشملهم السعر الثابت (اتركه فارغًا لغير محدود)" : "Travellers one flat price covers (blank = unlimited)"}
            className="w-20 rounded-lg border border-charcoal/15 px-2 py-1 text-sm"
          />
        )}
        <input
          type="number" min={0} step={10} value={val} onChange={(e) => setVal(e.target.value)}
          placeholder={ar ? "السعر" : "price"}
          className="w-24 rounded-lg border border-charcoal/15 px-2 py-1 text-sm"
        />
        <button onClick={() => save(on)} disabled={busy} className="btn-dark px-3 py-1 text-xs">{pick(t.pricing.save)}</button>
      </div>
      {description.trim() !== "" && (
        <p className="mt-1 text-xs text-charcoal/45">{description}</p>
      )}
    </div>
  );
}

/** Small live indicator of whether a service is offered (has a price) or hidden. */
function OfferedPill({ offered }: { offered: boolean }) {
  const { t, pick } = useI18n();
  return (
    <span className={`badge shrink-0 ${offered ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/5 text-charcoal/45"}`}>
      <span className={`me-1 inline-block h-1.5 w-1.5 rounded-full ${offered ? "bg-emerald-500" : "bg-charcoal/25"}`} />
      {offered ? pick(t.cities.shown) : pick(t.cities.hidden)}
    </span>
  );
}


/** Per-city per-class price overrides for one car service. Blank = use global. */
function CityClassPrices({ label, cityCode, stepType, vehicles, rows }: { label: string; cityCode: string; stepType: string; vehicles: VehicleOption[]; rows: ClassPriceRow[] }) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(vehicles.map((v) => [v.category, (rows.find((r) => r.category === v.category)?.price ?? "").toString()])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function save(cat: string) {
    setBusy(cat);
    const raw = (vals[cat] ?? "").trim();
    await setCityServiceClassPrice(cityCode, stepType, cat, raw === "" ? null : parseInt(raw) || 0);
    setBusy(null);
    router.refresh();
  }

  // A car service is offered when at least one vehicle class carries a price.
  const offered = vehicles.some((v) => (vals[v.category] ?? "").trim() !== "" && Number(vals[v.category]) > 0);

  return (
    <div className="rounded-lg border border-charcoal/10 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-charcoal/80">{label}</p>
        <OfferedPill offered={offered} />
      </div>
      <div className="grid gap-1.5">
        {vehicles.map((v) => (
          <div key={v.category} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs text-charcoal/55">{v.nameEn} ({v.category})</span>
            <input
              type="number" min={0} step={10}
              value={vals[v.category] ?? ""}
              placeholder="—"
              title={pick(t.cities.blankHides)}
              onChange={(e) => setVals((p) => ({ ...p, [v.category]: e.target.value }))}
              className="w-24 rounded-lg border border-charcoal/15 px-2 py-1 text-sm"
            />
            <button onClick={() => save(v.category)} disabled={busy === v.category} className="btn-dark px-2.5 py-1 text-xs">{pick(t.pricing.save)}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Per-city vehicle availability (enable/disable a class). No pricing here. */
function VehicleAvailability({ cityCode, rows, vehicles }: { cityCode: string; rows: VehicleRow[]; vehicles: VehicleOption[] }) {
  const { locale } = useI18n();
  return (
    <div className="luxe-card p-5">
      <h3 className="font-serif text-lg font-semibold text-charcoal">
        {locale === "ar" ? "توفّر المركبات" : "Vehicle availability"}
      </h3>
      <p className="mb-3 text-xs text-charcoal/45">
        {locale === "ar" ? "ألغِ التفعيل لإخفاء الفئة في هذه المدينة." : "Uncheck to hide a class in this city."}
      </p>
      <div className="grid gap-2">
        {vehicles.map((v) => {
          const row = rows.find((r) => r.category === v.category);
          return (
            <VehicleToggleRow
              key={v.category}
              cityCode={cityCode}
              category={v.category}
              label={`${v.nameEn} (${v.category})`}
              enabled={row?.enabled ?? true}
            />
          );
        })}
      </div>
    </div>
  );
}

function VehicleToggleRow({ cityCode, category, label, enabled }: { cityCode: string; category: string; label: string; enabled: boolean }) {
  const { t, pick } = useI18n();
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function toggle(v: boolean) {
    setOn(v);
    setBusy(true);
    await setCityVehicleEnabled(cityCode, category, v);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-charcoal/10 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-charcoal/80">{label}</span>
      <label className="flex items-center gap-1 text-xs text-charcoal/60">
        <input type="checkbox" disabled={busy} className="h-4 w-4 accent-gold" checked={on} onChange={(e) => toggle(e.target.checked)} />
        {pick(t.cities.enabled)}
      </label>
    </div>
  );
}
