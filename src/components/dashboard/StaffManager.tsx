"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { FieldWrap, TextInput } from "@/components/ui/Field";
import { createStaffUser, toggleStaffActive } from "@/server/actions/users.actions";
import { formatDateTime } from "@/lib/utils";

interface StaffRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
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
  role: "EMPLOYEE" | "DRIVER";
  staff: StaffRow[];
  countLabel: string;
}) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    setError(undefined);
    const res = await createStaffUser({ ...form, role });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setForm({ fullName: "", email: "", phone: "", password: "" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">{title}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="luxe-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-charcoal/5 bg-ivory-warm text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3 text-start">{pick(t.fields.fullName)}</th>
                <th className="px-4 py-3 text-start">{pick(t.auth.email)}</th>
                <th className="px-4 py-3 text-start">{countLabel}</th>
                <th className="px-4 py-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-charcoal">{s.fullName}</p>
                    <p className="text-xs text-charcoal/40">{s.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{s.email}</td>
                  <td className="px-4 py-3 font-medium text-charcoal">{s.count}</td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={async () => { await toggleStaffActive(s.id, !s.isActive); router.refresh(); }}
                      className={`badge ${s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/5 text-charcoal/40"}`}
                    >
                      {s.isActive ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "موقوف" : "Inactive")}
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-charcoal/40">—</td></tr>
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
              <TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </FieldWrap>
            <FieldWrap label={pick(t.auth.email)}>
              <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </FieldWrap>
            <FieldWrap label={pick(t.fields.phone)}>
              <TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </FieldWrap>
            <FieldWrap label={pick(t.auth.password)}>
              <TextInput type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </FieldWrap>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button onClick={add} disabled={busy} className="btn-gold w-full">{pick(t.common.save)}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
