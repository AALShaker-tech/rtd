"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { FieldWrap, TextInput } from "@/components/ui/Field";
import {
  createStaffUser,
  toggleStaffActive,
  resetStaffPassword,
} from "@/server/actions/users.actions";
import { formatDateTime } from "@/lib/utils";
import { isOnline } from "@/lib/presence";

interface StaffRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  mustSetPassword: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  count: number;
}

export function StaffManager({
  title,
  role,
  staff,
  countLabel,
}: {
  title: string;
  role: "EMPLOYEE" | "DRIVER" | "ADMIN";
  staff: StaffRow[];
  countLabel: string;
}) {
  const { t, pick, locale } = useI18n();
  const ar = locale === "ar";
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [rowMsg, setRowMsg] = useState<{ ok: boolean; text: string } | undefined>();
  const [pendingId, setPendingId] = useState<string | undefined>();

  async function doReset(s: StaffRow) {
    // A reset of an already-active account invalidates their current password
    // until they set a new one — confirm before doing that. Resending an
    // activation link to a pending account is harmless, so skip the prompt.
    if (!s.mustSetPassword) {
      const msg = ar
        ? `سيتم إبطال كلمة مرور ${s.email} الحالية حتى يعيّن كلمة مرور جديدة. المتابعة؟`
        : `This invalidates ${s.email}'s current password until they set a new one. Continue?`;
      if (!window.confirm(msg)) return;
    }
    setPendingId(s.id);
    setRowMsg(undefined);
    const res = await resetStaffPassword(s.id);
    setPendingId(undefined);
    if (!res.ok) return setRowMsg({ ok: false, text: res.error });
    setRowMsg({
      ok: res.emailed,
      text: res.emailed
        ? ar
          ? `أُرسل رابط إلى ${s.email}`
          : `Link sent to ${s.email}`
        : ar
          ? "تعذّر إرسال البريد."
          : "Couldn't send the email.",
    });
    router.refresh();
  }

  async function doToggle(s: StaffRow) {
    setPendingId(s.id);
    setRowMsg(undefined);
    const res = await toggleStaffActive(s.id, !s.isActive);
    setPendingId(undefined);
    if (!res.ok) return setRowMsg({ ok: false, text: res.error });
    router.refresh();
  }

  async function add() {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    const res = await createStaffUser({ ...form, role });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setForm({ fullName: "", email: "", phone: "" });
    setNotice(
      res.emailed
        ? locale === "ar"
          ? "تم الإنشاء — أُرسل رابط التفعيل إلى البريد."
          : "Created — an activation link was emailed."
        : locale === "ar"
          ? "تم الإنشاء، لكن تعذّر إرسال البريد. يمكن للمستخدم طلب رابط من صفحة تعيين كلمة المرور."
          : "Created, but the email couldn't be sent. The user can request a link from the set-password page.",
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">{title}</h1>

      {rowMsg && (
        <p className={`text-sm ${rowMsg.ok ? "text-emerald-700" : "text-red-600"}`}>
          {rowMsg.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="luxe-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-charcoal/5 bg-ivory-warm text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3 text-start">{pick(t.fields.fullName)}</th>
                <th className="px-4 py-3 text-start">{pick(t.auth.email)}</th>
                <th className="px-4 py-3 text-start">{countLabel}</th>
                <th className="px-4 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-end">{pick(t.admin.actions)}</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-2 font-medium text-charcoal">
                      {isOnline(s.lastSeenAt) && (
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                          title={ar ? "متصل الآن" : "Online now"}
                        />
                      )}
                      {s.fullName}
                    </p>
                    <p className="text-xs text-charcoal/40">{s.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{s.email}</td>
                  <td className="px-4 py-3 font-medium text-charcoal">{s.count}</td>
                  <td className="px-4 py-3">
                    <StatusBadge s={s} ar={ar} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => doReset(s)}
                        disabled={pendingId === s.id}
                        className="rounded-md border border-charcoal/15 px-2.5 py-1 text-xs text-charcoal/70 hover:bg-ivory-warm disabled:opacity-50"
                      >
                        {s.mustSetPassword
                          ? ar
                            ? "إعادة إرسال"
                            : "Resend"
                          : ar
                            ? "إعادة تعيين"
                            : "Reset"}
                      </button>
                      <button
                        onClick={() => doToggle(s)}
                        disabled={pendingId === s.id}
                        className={`rounded-md px-2.5 py-1 text-xs disabled:opacity-50 ${
                          s.isActive
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {s.isActive ? (ar ? "تعطيل" : "Deactivate") : ar ? "تفعيل" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-charcoal/40">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="luxe-card h-fit p-5">
          <h3 className="mb-4 font-serif text-lg font-semibold text-charcoal">
            {locale === "ar" ? "إضافة جديد" : "Add new"}
          </h3>
          <div className="space-y-3">
            <FieldWrap label={pick(t.fields.fullName)}>
              <TextInput
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </FieldWrap>
            <FieldWrap label={pick(t.auth.email)}>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FieldWrap>
            <FieldWrap label={`${pick(t.fields.phone)} (${pick(t.common.optional)})`}>
              <TextInput
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FieldWrap>
            <p className="text-xs text-charcoal/40">
              {locale === "ar"
                ? "سيصل المستخدم رابط تفعيل لتعيين كلمة المرور بنفسه."
                : "The user receives an activation link to set their own password."}
            </p>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {notice && <p className="text-xs text-emerald-700">{notice}</p>}
            <button onClick={add} disabled={busy} className="btn-gold w-full">
              {pick(t.common.save)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ s, ar }: { s: StaffRow; ar: boolean }) {
  // Pending (awaiting first-time activation) takes precedence over active/inactive.
  const { cls, label } = s.mustSetPassword
    ? { cls: "bg-amber-50 text-amber-700", label: ar ? "بانتظار التفعيل" : "Pending" }
    : s.isActive
      ? { cls: "bg-emerald-50 text-emerald-700", label: ar ? "نشط" : "Active" }
      : { cls: "bg-charcoal/5 text-charcoal/40", label: ar ? "موقوف" : "Inactive" };
  return <span className={`badge ${cls}`}>{label}</span>;
}
