"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useJourneyStore } from "@/store/journeyStore";
import { COUNTRY_CODES, isValidEmail, parsePhone } from "@/lib/phone";
import { JourneySummary } from "@/components/journey/JourneySummary";
import { confirmVerificationCode, sendVerificationCode } from "@/server/actions/verification.actions";

export default function DetailsPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const ar = locale === "ar";

  const customer = useJourneyStore((s) => s.customer);
  const setCustomer = useJourneyStore((s) => s.setCustomer);
  const steps = useJourneyStore((s) => s.steps);
  const phoneVerified = useJourneyStore((s) => s.phoneVerified);
  const emailVerified = useJourneyStore((s) => s.emailVerified);
  const setPhoneVerified = useJourneyStore((s) => s.setPhoneVerified);
  const setEmailVerified = useJourneyStore((s) => s.setEmailVerified);

  useEffect(() => {
    if (steps.filter((s) => !s.skipped).length === 0) router.replace("/journey");
  }, [steps, router]);

  const phoneCheck = parsePhone(customer.phone || "", customer.phoneCountry || "SA");
  const emailOk = isValidEmail(customer.email || "");
  const nameOk = (customer.fullName || "").trim().length >= 3;
  const canContinue = nameOk && phoneCheck.valid && emailOk;

  function cont() {
    if (!canContinue) return;
    setCustomer({ language: locale });
    router.push("/journey/review");
  }

  return (
    <div className="luxe-container max-w-6xl py-10 md:py-14">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.details.title)}</h1>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/60">{pick(t.details.subtitle)}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="luxe-card space-y-5 p-6 md:p-8">
          <Field label={pick(t.fields.fullName)}>
            <input className="field-input" value={customer.fullName} onChange={(e) => setCustomer({ fullName: e.target.value })} placeholder={ar ? "الاسم الكامل" : "Your full name"} />
          </Field>

          {/* Phone + inline verification */}
          <div>
            <span className="field-label">{pick(t.fields.phone)}</span>
            <div className="flex gap-2">
              <select className="field-input w-32 shrink-0" value={customer.phoneCountry} onChange={(e) => setCustomer({ phoneCountry: e.target.value })}>
                {COUNTRY_CODES.map((c) => (<option key={c.code} value={c.code}>{c.dial} {c.code}</option>))}
              </select>
              <input className="field-input flex-1" inputMode="tel" value={customer.phone} onChange={(e) => { setCustomer({ phone: e.target.value }); setPhoneVerified(false); }} placeholder="5XXXXXXXX" />
            </div>
            <InlineVerify kind="PHONE" valid={phoneCheck.valid} verified={phoneVerified} target={phoneCheck.e164 ?? customer.phone} onVerified={() => setPhoneVerified(true)} />
          </div>

          {/* Email + inline verification */}
          <div>
            <span className="field-label">{pick(t.fields.email)}</span>
            <input className="field-input" inputMode="email" value={customer.email} onChange={(e) => { setCustomer({ email: e.target.value }); setEmailVerified(false); }} placeholder="name@example.com" />
            <InlineVerify kind="EMAIL" valid={emailOk} verified={emailVerified} target={customer.email} onVerified={() => setEmailVerified(true)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ToggleField label={pick(t.fields.children)} value={customer.children} onChange={(v) => setCustomer({ children: v })} yes={pick(t.common.yes)} no={pick(t.common.no)} />
            <ToggleField label={pick(t.fields.childSeat)} value={customer.childSeat} onChange={(v) => setCustomer({ childSeat: v })} yes={pick(t.common.yes)} no={pick(t.common.no)} />
          </div>
          {customer.childSeat && !customer.children && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{ar ? "اخترت مقعد أطفال مع عدم وجود أطفال." : "You selected a child seat but indicated no children."}</p>
          )}

          <Field label={pick(t.fields.notes)}>
            <textarea className="field-input min-h-[90px] resize-y" value={customer.notes ?? ""} onChange={(e) => setCustomer({ notes: e.target.value })} />
          </Field>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-ivory-warm p-4">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-gold" checked={customer.contactMeInstead} onChange={(e) => setCustomer({ contactMeInstead: e.target.checked })} />
            <span className="text-sm text-charcoal/70">{pick(t.details.contactMe)}</span>
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <button onClick={() => router.push("/journey")} className="btn-ghost">{ar ? "→" : "←"} {pick(t.common.back)}</button>
            <button onClick={cont} disabled={!canContinue} className="btn-gold">{pick(t.builder.reviewJourney)} {ar ? "←" : "→"}</button>
          </div>
        </div>

        <div className="hidden lg:block">
          <JourneySummary />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="field-label">{label}</span>{children}</label>);
}

function ToggleField({ label, value, onChange, yes, no }: { label: string; value: boolean; onChange: (v: boolean) => void; yes: string; no: string }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex gap-2">
        {[{ v: true, l: yes }, { v: false, l: no }].map((o) => (
          <button key={o.l} type="button" onClick={() => onChange(o.v)} className={`badge flex-1 justify-center border py-2.5 transition ${value === o.v ? "border-gold bg-gold-50 text-gold-dark" : "border-charcoal/15 text-charcoal/50"}`}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}

function InlineVerify({ kind, valid, verified, target, onVerified }: { kind: "PHONE" | "EMAIL"; valid: boolean; verified: boolean; target: string; onVerified: () => void }) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  if (!valid) return null;
  if (verified) return <p className="mt-1.5 text-xs font-medium text-emerald-600">✓ {pick(t.verify.verified)}</p>;

  async function send() {
    setBusy(true); setError(undefined);
    const res = await sendVerificationCode({ target, purpose: kind, channel: kind === "PHONE" ? "WHATSAPP" : "EMAIL", phoneCountry: "SA" });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true); setDevCode(res.devCode);
  }
  async function confirm() {
    setBusy(true); setError(undefined);
    const res = await confirmVerificationCode({ target, purpose: kind, code });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onVerified();
  }

  return (
    <div className="mt-2">
      {!sent ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-charcoal/50">{pick(t.verify.pending)}</span>
          <button onClick={send} disabled={busy} className="text-xs font-medium text-gold-dark hover:underline">
            {kind === "PHONE" ? pick(t.verify.sendViaWhatsapp) : pick(t.verify.sendEmail)}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="field-input w-28 tracking-[0.4em]" inputMode="numeric" />
          <button onClick={confirm} disabled={busy || code.length < 4} className="btn-gold px-4 py-2 text-xs">{pick(t.verify.verifyNow)}</button>
          {devCode && <span className="text-[11px] text-charcoal/50">{ar ? "رمز التطوير:" : "dev code:"} <b className="font-mono text-gold-dark">{devCode}</b></span>}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
