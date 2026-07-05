"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { formatPrice } from "@/lib/pricing";
import { COUNTRY_CODES } from "@/lib/phone";
import { packageName, packageDescription, type CatalogPackage } from "@/lib/packages";
import { submitPackageBooking } from "@/server/actions/package.actions";
import { useJourneyStore } from "@/store/journeyStore";

export function PackagesView({ packages }: { packages: CatalogPackage[] }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const router = useRouter();
  const startBlank = useJourneyStore((s) => s.startBlank);
  const [selected, setSelected] = useState<CatalogPackage | null>(null);

  if (selected) {
    return <BookingForm pkg={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="luxe-container py-14 md:py-20">
      <div className="mb-12 text-center">
        <div className="gold-rule mx-auto mb-6" />
        <h1 className="text-4xl font-semibold text-charcoal md:text-5xl">{pick(t.packages.title)}</h1>
        <p className="mx-auto mt-4 max-w-xl text-charcoal/60">{pick(t.packages.subtitle)}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => (
          <div key={p.id} className={`luxe-card luxe-card-hover flex flex-col p-7 ${p.featured ? "ring-2 ring-gold" : ""}`}>
            {p.featured && <span className="badge mb-3 w-fit bg-gold-gradient text-charcoal">{ar ? "مميزة" : "Featured"}</span>}
            <h3 className="font-serif text-2xl font-semibold text-charcoal">{packageName(p, locale)}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/60">{packageDescription(p, locale)}</p>
            <p className="mt-5 font-serif text-2xl font-semibold text-gold-dark">{formatPrice(p.price, locale)}</p>
            <button onClick={() => setSelected(p)} className="btn-dark mt-4 w-full">{pick(t.packages.choose)}</button>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button onClick={() => { startBlank(); router.push("/journey"); }} className="btn-outline">{pick(t.packages.buildOwn)}</button>
      </div>
    </div>
  );
}

function BookingForm({ pkg, onBack }: { pkg: CatalogPackage; onBack: () => void }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phoneCountry: "SA", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const canSubmit = form.fullName.trim().length >= 2 && form.phone.trim().length >= 5;

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(undefined);
    const res = await submitPackageBooking({
      packageId: pkg.id,
      fullName: form.fullName,
      phone: form.phone,
      phoneCountry: form.phoneCountry,
      email: form.email || undefined,
      language: locale,
      notes: form.notes || undefined,
    });
    if (res.ok) {
      router.replace(`/success/${encodeURIComponent(res.referenceNumber!)}`);
    } else {
      setSubmitting(false);
      setError(res.error);
    }
  }

  return (
    <div className="luxe-container max-w-2xl py-12 md:py-16">
      <button onClick={onBack} className="btn-ghost mb-6 text-xs">{ar ? "→" : "←"} {pick(t.common.back)}</button>
      <div className="luxe-card p-6 md:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-charcoal">{packageName(pkg, locale)}</h1>
            <p className="mt-1 text-sm text-charcoal/60">{packageDescription(pkg, locale)}</p>
          </div>
          <span className="whitespace-nowrap font-serif text-xl font-semibold text-gold-dark">{formatPrice(pkg.price, locale)}</span>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="field-label">{pick(t.fields.fullName)}</span>
            <input className="field-input" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder={ar ? "الاسم الكامل" : "Your full name"} />
          </label>

          <div>
            <span className="field-label">{pick(t.fields.phone)}</span>
            <div className="flex gap-2">
              <select className="field-input w-32 shrink-0" value={form.phoneCountry} onChange={(e) => set({ phoneCountry: e.target.value })}>
                {COUNTRY_CODES.map((c) => (<option key={c.code} value={c.code}>{c.dial} {c.code}</option>))}
              </select>
              <input className="field-input flex-1" inputMode="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="5XXXXXXXX" />
            </div>
          </div>

          <label className="block">
            <span className="field-label">{pick(t.fields.email)} — {pick(t.common.optional)}</span>
            <input className="field-input" inputMode="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@example.com" />
          </label>

          <label className="block">
            <span className="field-label">{pick(t.fields.notes)} — {pick(t.common.optional)}</span>
            <textarea className="field-input min-h-[90px] resize-y" value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder={ar ? "أي تفاصيل أو طلبات خاصة" : "Any details or special requests"} />
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

          <button onClick={submit} disabled={!canSubmit || submitting} className="btn-gold w-full">
            {submitting ? pick(t.common.loading) : pick(t.packages.choose)}
          </button>
          <p className="text-center text-xs text-charcoal/45">{pick(t.packages.tailoredOffer)}</p>
        </div>
      </div>
    </div>
  );
}
