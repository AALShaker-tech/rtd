"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { FieldWrap, TextInput } from "@/components/ui/Field";
import { updateAppSettings } from "@/server/actions/settings.actions";
import { sendTestEmail } from "@/server/actions/email.actions";
import type { AdminSettings } from "@/server/services/settings.service";

export function SettingsIntegrations({
  settings,
  smsProvider,
  adminEmail,
  canEdit,
}: {
  settings: AdminSettings;
  smsProvider: string;
  adminEmail: string;
  canEdit: boolean;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";

  return (
    <div className="max-w-lg space-y-6">
      {canEdit ? (
        <ConfigForm settings={settings} ar={ar} />
      ) : (
        <ReadOnly settings={settings} smsProvider={smsProvider} ar={ar} />
      )}
      <TestEmail defaultEmail={adminEmail} />
    </div>
  );
}

function ConfigForm({ settings, ar }: { settings: AdminSettings; ar: boolean }) {
  const { t, pick } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    whatsappNumber: settings.whatsappNumber,
    whatsappDisplay: settings.whatsappDisplay,
    opsAlertEmail: settings.opsAlertEmail,
    emailFrom: settings.emailFrom,
    emailProvider: settings.emailProvider,
    brevoApiKey: "",
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const secretPlaceholder = (isSet: boolean) =>
    isSet ? (ar ? "•••••••• (محفوظ)" : "•••••••• (saved)") : ar ? "غير محدد" : "not set";

  async function save() {
    setBusy(true);
    setResult(null);
    const res = await updateAppSettings(form);
    setBusy(false);
    if (res.ok) {
      setResult({ ok: true, msg: ar ? "تم الحفظ" : "Saved" });
      setForm((f) => ({ ...f, brevoApiKey: "", smtpPassword: "" }));
      router.refresh();
    } else {
      setResult({ ok: false, msg: res.error });
    }
  }

  return (
    <div className="luxe-card space-y-5 p-6">
      <Section title={ar ? "واتساب" : "WhatsApp"}>
        <FieldWrap
          label={
            ar ? "رقم واتساب (بالصيغة الدولية بدون +)" : "WhatsApp number (international, no +)"
          }
        >
          <TextInput
            value={form.whatsappNumber}
            onChange={(e) => set("whatsappNumber", e.target.value)}
            placeholder="966550832444"
          />
        </FieldWrap>
        <FieldWrap label={ar ? "رقم العرض" : "Display number"}>
          <TextInput
            value={form.whatsappDisplay}
            onChange={(e) => set("whatsappDisplay", e.target.value)}
            placeholder="+966 55 083 2444"
          />
        </FieldWrap>
      </Section>

      <Section title={ar ? "التنبيهات" : "Notifications"}>
        <FieldWrap label={ar ? "بريد تنبيه الطلبات الجديدة" : "New-request alert email"}>
          <TextInput
            type="email"
            value={form.opsAlertEmail}
            onChange={(e) => set("opsAlertEmail", e.target.value)}
            placeholder="ops@ratbli.sa"
          />
        </FieldWrap>
      </Section>

      <Section title={ar ? "البريد الإلكتروني" : "Email"}>
        <FieldWrap label={ar ? "مزود البريد" : "Email provider"}>
          <select
            value={form.emailProvider}
            onChange={(e) => set("emailProvider", e.target.value)}
            className="w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal"
          >
            <option value="console">console (log only)</option>
            <option value="smtp">smtp</option>
            <option value="brevo">brevo (API)</option>
          </select>
        </FieldWrap>
        <FieldWrap label={ar ? "المُرسِل (from)" : "Sender (from)"}>
          <TextInput
            value={form.emailFrom}
            onChange={(e) => set("emailFrom", e.target.value)}
            placeholder="RTD Concierge <noreply@ratbli.sa>"
          />
        </FieldWrap>
        <FieldWrap label={ar ? "مفتاح Brevo API" : "Brevo API key"}>
          <TextInput
            type="password"
            value={form.brevoApiKey}
            onChange={(e) => set("brevoApiKey", e.target.value)}
            placeholder={secretPlaceholder(settings.brevoApiKeySet)}
            autoComplete="off"
          />
        </FieldWrap>
        <FieldWrap label={ar ? "خادم SMTP" : "SMTP host"}>
          <TextInput
            value={form.smtpHost}
            onChange={(e) => set("smtpHost", e.target.value)}
            placeholder="smtp-relay.brevo.com"
          />
        </FieldWrap>
        <FieldWrap label={ar ? "منفذ SMTP" : "SMTP port"}>
          <TextInput
            value={form.smtpPort}
            onChange={(e) => set("smtpPort", e.target.value)}
            placeholder="587"
          />
        </FieldWrap>
        <FieldWrap label={ar ? "مستخدم SMTP" : "SMTP user"}>
          <TextInput
            value={form.smtpUser}
            onChange={(e) => set("smtpUser", e.target.value)}
            autoComplete="off"
          />
        </FieldWrap>
        <FieldWrap label={ar ? "كلمة مرور SMTP" : "SMTP password"}>
          <TextInput
            type="password"
            value={form.smtpPassword}
            onChange={(e) => set("smtpPassword", e.target.value)}
            placeholder={secretPlaceholder(settings.smtpPasswordSet)}
            autoComplete="off"
          />
        </FieldWrap>
        <p className="text-xs text-charcoal/40">
          {ar
            ? "اترك حقول الأسرار فارغة للإبقاء على القيمة الحالية."
            : "Leave secret fields blank to keep the current value."}
        </p>
      </Section>

      {result && (
        <p className={`text-sm ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.msg}</p>
      )}
      <button onClick={save} disabled={busy} className="btn-gold w-full">
        {busy ? pick(t.common.loading) : pick(t.common.save)}
      </button>
    </div>
  );
}

function ReadOnly({
  settings,
  smsProvider,
  ar,
}: {
  settings: AdminSettings;
  smsProvider: string;
  ar: boolean;
}) {
  return (
    <div className="luxe-card space-y-3 p-6">
      <p className="rounded-lg bg-gold-50 px-4 py-3 text-xs text-gold-dark">
        {ar
          ? "هذه الإعدادات يعدّلها المسؤول الأعلى (Super admin)."
          : "These settings are managed by the superadmin."}
      </p>
      <Row
        k={ar ? "رقم واتساب" : "WhatsApp number"}
        v={settings.whatsappDisplay || settings.whatsappNumber}
      />
      <Row k={ar ? "بريد التنبيهات" : "Alert email"} v={settings.opsAlertEmail || "—"} />
      <Row k={ar ? "المُرسِل" : "Email from"} v={settings.emailFrom || "—"} />
      <Row k={ar ? "مزود البريد" : "Email provider"} v={settings.emailProvider} />
      <Row k={ar ? "مزود الرسائل" : "SMS provider"} v={smsProvider} />
    </div>
  );
}

function TestEmail({ defaultEmail }: { defaultEmail: string }) {
  const { t, pick } = useI18n();
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    const res = await sendTestEmail(email);
    setBusy(false);
    setResult(
      res.ok
        ? { ok: true, msg: `${pick(t.admin.testEmailSent)} ${res.to}` }
        : { ok: false, msg: res.error },
    );
  }

  return (
    <div className="luxe-card space-y-2 p-6">
      <p className="text-sm font-medium text-charcoal">{pick(t.admin.testEmail)}</p>
      <p className="text-xs text-charcoal/50">{pick(t.admin.testEmailHint)}</p>
      <FieldWrap label={pick(t.auth.email)}>
        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@ratbli.sa"
        />
      </FieldWrap>
      <button onClick={run} disabled={busy} className="btn-outline w-full">
        {busy ? pick(t.common.loading) : pick(t.admin.sendTestEmail)}
      </button>
      {result && (
        <p className={`text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.msg}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-serif text-lg font-semibold text-charcoal">{title}</h3>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-ivory-warm px-4 py-3">
      <span className="text-sm text-charcoal/60">{k}</span>
      <span className="font-mono text-sm text-charcoal">{v}</span>
    </div>
  );
}
