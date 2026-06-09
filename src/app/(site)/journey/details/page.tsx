"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useJourneyStore } from "@/store/journeyStore";
import { COUNTRY_CODES, isValidEmail, parsePhone } from "@/lib/phone";
import {
  confirmVerificationCode,
  sendVerificationCode,
} from "@/server/actions/verification.actions";

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
    <div className="ink-wrap rise pb-20 pt-6">
      <h1 className="disp text-[26px] font-semibold text-cream">{pick(t.details.title)}</h1>
      <p className="mb-5 mt-1.5 text-[14.5px] text-dim">{pick(t.details.subtitle)}</p>

      <div className="grid gap-4">
        <Field label={pick(t.fields.fullName)}>
          <input className="dinput" value={customer.fullName} onChange={(e) => setCustomer({ fullName: e.target.value })} placeholder={ar ? "الاسم الكامل" : "Your full name"} />
        </Field>

        {/* Phone with inline verification */}
        <div>
          <span className="mb-1.5 block text-[13px] text-dim">{pick(t.fields.phone)}</span>
          <div className="flex gap-2">
            <select className="dinput w-28 flex-shrink-0" value={customer.phoneCountry} onChange={(e) => setCustomer({ phoneCountry: e.target.value })}>
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code} className="bg-ink-800">{c.dial} {c.code}</option>
              ))}
            </select>
            <input className="dinput flex-1" inputMode="tel" value={customer.phone} onChange={(e) => { setCustomer({ phone: e.target.value }); setPhoneVerified(false); }} placeholder="5XXXXXXXX" style={{ textAlign: ar ? "right" : "left" }} />
          </div>
          <InlineVerify
            kind="PHONE"
            valid={phoneCheck.valid}
            verified={phoneVerified}
            target={phoneCheck.e164 ?? customer.phone}
            onVerified={() => setPhoneVerified(true)}
          />
        </div>

        {/* Email with inline verification */}
        <div>
          <span className="mb-1.5 block text-[13px] text-dim">{pick(t.fields.email)}</span>
          <input className="dinput" inputMode="email" value={customer.email} onChange={(e) => { setCustomer({ email: e.target.value }); setEmailVerified(false); }} placeholder="name@example.com" style={{ textAlign: ar ? "right" : "left" }} />
          <InlineVerify
            kind="EMAIL"
            valid={emailOk}
            verified={emailVerified}
            target={customer.email}
            onVerified={() => setEmailVerified(true)}
          />
        </div>

        {/* Children / child seat */}
        <div className="grid grid-cols-2 gap-3">
          <ToggleField label={pick(t.fields.children)} value={customer.children} onChange={(v) => setCustomer({ children: v })} yes={pick(t.common.yes)} no={pick(t.common.no)} />
          <ToggleField label={pick(t.fields.childSeat)} value={customer.childSeat} onChange={(v) => setCustomer({ childSeat: v })} yes={pick(t.common.yes)} no={pick(t.common.no)} />
        </div>
        {customer.childSeat && !customer.children && (
          <p className="rounded-lg px-3 py-2 text-[12.5px]" style={{ background: "rgba(217,164,65,.10)", color: "#d9a441" }}>
            {ar ? "اخترت مقعد أطفال مع عدم وجود أطفال." : "You selected a child seat but indicated no children."}
          </p>
        )}

        <Field label={pick(t.fields.notes)}>
          <textarea className="dinput min-h-[80px] resize-y" value={customer.notes ?? ""} onChange={(e) => setCustomer({ notes: e.target.value })} />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border gold-line p-4" style={{ background: "rgba(255,255,255,.03)" }}>
          <input type="checkbox" className="mt-1 h-4 w-4 accent-gold" checked={customer.contactMeInstead} onChange={(e) => setCustomer({ contactMeInstead: e.target.checked })} />
          <span className="text-[13.5px] text-dim">{pick(t.details.contactMe)}</span>
        </label>
      </div>

      <div className="mt-6 flex gap-2.5">
        <button onClick={() => router.push("/journey")} className="obtn">{ar ? "→" : "←"} {pick(t.common.back)}</button>
        <button onClick={cont} disabled={!canContinue} className="gbtn flex-1">{pick(t.builder.reviewJourney)} {ar ? "←" : "→"}</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-dim">{label}</span>
      {children}
    </label>
  );
}

function ToggleField({ label, value, onChange, yes, no }: { label: string; value: boolean; onChange: (v: boolean) => void; yes: string; no: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] text-dim">{label}</span>
      <div className="flex gap-2">
        {[{ v: true, l: yes }, { v: false, l: no }].map((o) => (
          <button key={o.l} onClick={() => onChange(o.v)} className={`flex-1 rounded-lg border py-2.5 text-[13px] ${value === o.v ? "dcard-selected text-gold" : "gold-line text-dim"}`}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function InlineVerify({
  kind,
  valid,
  verified,
  target,
  onVerified,
}: {
  kind: "PHONE" | "EMAIL";
  valid: boolean;
  verified: boolean;
  target: string;
  onVerified: () => void;
}) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  if (!valid) return null;
  if (verified) {
    return <p className="mt-1.5 text-[12px] font-medium text-emerald-400">✓ {pick(t.verify.verified)}</p>;
  }

  async function send() {
    setBusy(true);
    setError(undefined);
    const res = await sendVerificationCode({ target, purpose: kind, channel: kind === "PHONE" ? "WHATSAPP" : "EMAIL", phoneCountry: "SA" });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
    setDevCode(res.devCode);
  }
  async function confirm() {
    setBusy(true);
    setError(undefined);
    const res = await confirmVerificationCode({ target, purpose: kind, code });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onVerified();
  }

  return (
    <div className="mt-2">
      {!sent ? (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-dim">{pick(t.verify.pending)}</span>
          <button onClick={send} disabled={busy} className="text-[12px] font-medium text-gold underline-offset-2 hover:underline">
            {kind === "PHONE" ? pick(t.verify.sendViaWhatsapp) : pick(t.verify.sendEmail)}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="dinput w-28 tracking-[0.4em]" inputMode="numeric" />
          <button onClick={confirm} disabled={busy || code.length < 4} className="gbtn px-4 py-2 text-[13px]">{pick(t.verify.verifyNow)}</button>
          {devCode && <span className="text-[11px] text-dim">{ar ? "رمز التطوير:" : "dev code:"} <b className="font-mono text-gold">{devCode}</b></span>}
        </div>
      )}
      {error && <p className="mt-1 text-[12px] text-red-400">{error}</p>}
    </div>
  );
}
