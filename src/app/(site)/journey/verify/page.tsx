"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useJourneyStore } from "@/store/journeyStore";
import { parsePhone } from "@/lib/phone";
import { JourneyProgress } from "@/components/journey/JourneyProgress";
import { FieldWrap, TextInput } from "@/components/ui/Field";
import {
  confirmVerificationCode,
  sendVerificationCode,
} from "@/server/actions/verification.actions";

type Channel = "PHONE" | "EMAIL";

export default function VerifyPage() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const customer = useJourneyStore((s) => s.customer);
  const phoneVerified = useJourneyStore((s) => s.phoneVerified);
  const emailVerified = useJourneyStore((s) => s.emailVerified);
  const setPhoneVerified = useJourneyStore((s) => s.setPhoneVerified);
  const setEmailVerified = useJourneyStore((s) => s.setEmailVerified);

  useEffect(() => {
    if (!customer.phone || !customer.email) router.replace("/journey/details");
  }, [customer, router]);

  return (
    <div className="luxe-container py-10 md:py-14">
      <JourneyProgress current="verify" />
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-charcoal md:text-4xl">{pick(t.verify.title)}</h1>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/60">{pick(t.verify.subtitle)}</p>
      </div>

      <div className="mx-auto max-w-lg space-y-5">
        <VerifyCard
          purpose="PHONE"
          target={parsePhone(customer.phone, customer.phoneCountry).e164 ?? customer.phone}
          verified={phoneVerified}
          onVerified={() => setPhoneVerified(true)}
        />
        <VerifyCard
          purpose="EMAIL"
          target={customer.email}
          verified={emailVerified}
          onVerified={() => setEmailVerified(true)}
        />

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <button onClick={() => router.push("/journey/details")} className="btn-ghost">
            ← {pick(t.common.back)}
          </button>
          <div className="flex gap-3">
            <button onClick={() => router.push("/journey/review")} className="btn-outline">
              {pick(t.verify.skipForNow)}
            </button>
            <button onClick={() => router.push("/journey/review")} className="btn-gold">
              {pick(t.builder.reviewJourney)} →
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-charcoal/40">
          {locale === "ar"
            ? "يمكنك المتابعة الآن وسيتم وضع التواصل كقيد التأكيد."
            : "You can continue now — unverified contacts are marked as pending."}
        </p>
      </div>
    </div>
  );
}

function VerifyCard({
  purpose,
  target,
  verified,
  onVerified,
}: {
  purpose: Channel;
  target: string;
  verified: boolean;
  onVerified: () => void;
}) {
  const { t, pick, locale } = useI18n();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function send(channel: "SMS" | "WHATSAPP" | "EMAIL") {
    setBusy(true);
    setError(undefined);
    const res = await sendVerificationCode({
      target,
      purpose,
      channel,
      phoneCountry: "SA",
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
    setDevCode(res.devCode);
  }

  async function confirm() {
    setBusy(true);
    setError(undefined);
    const res = await confirmVerificationCode({ target, purpose, code });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onVerified();
  }

  const title = purpose === "PHONE" ? pick(t.fields.phone) : pick(t.fields.email);

  return (
    <div className="luxe-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-medium text-charcoal">{title}</p>
          <p className="text-xs text-charcoal/50">{target}</p>
        </div>
        <span className={`badge ${verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {verified ? pick(t.verify.verified) : pick(t.verify.pending)}
        </span>
      </div>

      {!verified && (
        <>
          {!sent ? (
            <div className="flex flex-wrap gap-2">
              {purpose === "PHONE" ? (
                <>
                  <button disabled={busy} onClick={() => send("SMS")} className="btn-outline px-4 py-2 text-xs">
                    {pick(t.verify.sendPhone)}
                  </button>
                  <button disabled={busy} onClick={() => send("WHATSAPP")} className="btn-outline px-4 py-2 text-xs">
                    {pick(t.verify.sendViaWhatsapp)}
                  </button>
                </>
              ) : (
                <button disabled={busy} onClick={() => send("EMAIL")} className="btn-outline px-4 py-2 text-xs">
                  {pick(t.verify.sendEmail)}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <FieldWrap label={pick(t.verify.enterCode)} error={error}>
                <TextInput
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="••••••"
                  className="tracking-[0.5em]"
                />
              </FieldWrap>
              {devCode && (
                <p className="rounded-lg bg-charcoal/5 px-3 py-2 text-xs text-charcoal/60">
                  {pick(t.verify.devHint)} <strong className="font-mono">{devCode}</strong>
                </p>
              )}
              <div className="flex gap-2">
                <button disabled={busy || code.length < 4} onClick={confirm} className="btn-gold px-5 py-2 text-xs">
                  {pick(t.verify.verifyNow)}
                </button>
                <button disabled={busy} onClick={() => setSent(false)} className="btn-ghost px-4 py-2 text-xs">
                  {pick(t.verify.resend)}
                </button>
              </div>
            </div>
          )}
          {error && !sent && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
