"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  CITIES,
  REQUEST_STATUSES,
  STEPS,
  VEHICLES,
  getCity,
  vehicleLabel,
  type CarCategory,
  type RequestStatus,
} from "@/lib/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select, TextInput } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";

interface RequestRow {
  referenceNumber: string;
  name: string;
  phone: string;
  status: RequestStatus;
  carCategory: CarCategory;
  createdAt: Date | string;
  estimatedTotal: number;
  finalPrice: number | null;
  employee: string | null;
  driver: string | null;
  cities: string[];
}

export function RequestsView({
  requests,
  employees,
  drivers,
  filters,
}: {
  requests: RequestRow[];
  employees: { id: string; fullName: string }[];
  drivers: { id: string; fullName: string }[];
  filters: Record<string, string | undefined>;
}) {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState(filters.q ?? "");

  function apply(patch: Record<string, string | undefined>) {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && params.set(k, v));
    router.push(`/admin/requests?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.admin.requests)}</h1>
        <span className="text-sm text-charcoal/40">{requests.length}</span>
      </div>

      {/* Filters */}
      <div className="luxe-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-2 lg:col-span-2">
            <TextInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply({ q: q || undefined })}
              placeholder={pick(t.common.search) + "…"}
            />
            <button onClick={() => apply({ q: q || undefined })} className="btn-dark shrink-0 px-4 py-2 text-xs">
              {pick(t.common.search)}
            </button>
          </div>
          <Select value={filters.status ?? ""} onChange={(e) => apply({ status: e.target.value || undefined })}>
            <option value="">{pick(t.admin.changeStatus)} — {pick(t.common.all)}</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.name[locale]}</option>
            ))}
          </Select>
          <Select value={filters.city ?? ""} onChange={(e) => apply({ city: e.target.value || undefined })}>
            <option value="">{pick(t.fields.city)} — {pick(t.common.all)}</option>
            {CITIES.map((c) => (
              <option key={c.code} value={c.code}>{pick(c.name)}</option>
            ))}
          </Select>
          <Select value={filters.category ?? ""} onChange={(e) => apply({ category: e.target.value || undefined })}>
            <option value="">{pick(t.fields.carCategory)} — {pick(t.common.all)}</option>
            {VEHICLES.map((v) => (
              <option key={v.category} value={v.category}>{pick(v.name)}</option>
            ))}
          </Select>
          <Select value={filters.step ?? ""} onChange={(e) => apply({ step: e.target.value || undefined })}>
            <option value="">{pick(t.admin.services)} — {pick(t.common.all)}</option>
            {STEPS.map((s) => (
              <option key={s.type} value={s.type}>{pick(s.shortName)}</option>
            ))}
          </Select>
          <Select value={filters.employee ?? ""} onChange={(e) => apply({ employee: e.target.value || undefined })}>
            <option value="">{pick(t.admin.employees)} — {pick(t.common.all)}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </Select>
          <Select value={filters.driver ?? ""} onChange={(e) => apply({ driver: e.target.value || undefined })}>
            <option value="">{pick(t.admin.drivers)} — {pick(t.common.all)}</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName}</option>
            ))}
          </Select>
          <div className="flex gap-2">
            <TextInput type="date" value={filters.from ?? ""} onChange={(e) => apply({ from: e.target.value || undefined })} />
            <TextInput type="date" value={filters.to ?? ""} onChange={(e) => apply({ to: e.target.value || undefined })} />
          </div>
        </div>
        <button onClick={() => router.push("/admin/requests")} className="btn-ghost mt-3 px-3 py-1.5 text-xs">
          {locale === "ar" ? "مسح التصفية" : "Clear filters"}
        </button>
      </div>

      {/* Table */}
      <div className="luxe-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-charcoal/5 bg-ivory-warm text-start text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <Th>{pick(t.success.reference)}</Th>
                <Th>{pick(t.admin.customer)}</Th>
                <Th>{pick(t.fields.city)}</Th>
                <Th>{pick(t.fields.carCategory)}</Th>
                <Th>{pick(t.pricing.estimatedTotal)}</Th>
                <Th>{pick(t.admin.employees)}</Th>
                <Th>{pick(t.admin.changeStatus)}</Th>
                <Th>{pick(t.fields.date)}</Th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr
                  key={r.referenceNumber}
                  onClick={() => router.push(`/admin/requests/${r.referenceNumber}`)}
                  className="cursor-pointer border-b border-charcoal/5 transition hover:bg-ivory-warm"
                >
                  <Td><span className="font-mono text-xs font-semibold text-charcoal">{r.referenceNumber}</span></Td>
                  <Td>
                    <p className="font-medium text-charcoal">{r.name}</p>
                    <p className="text-xs text-charcoal/40">{r.phone}</p>
                  </Td>
                  <Td>{r.cities.map((c) => getCity(c)?.name[locale] ?? c).join(", ") || "—"}</Td>
                  <Td>{vehicleLabel(r.carCategory, locale)}</Td>
                  <Td>
                    <span className="font-medium text-charcoal">{formatPrice(r.finalPrice ?? r.estimatedTotal, locale)}</span>
                    {r.finalPrice != null && <span className="ms-1 text-[0.65rem] text-gold-dark">★</span>}
                  </Td>
                  <Td>{r.employee ?? <span className="text-charcoal/30">—</span>}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td><span className="text-xs text-charcoal/50">{formatDateTime(r.createdAt, locale, { dateStyle: "short" })}</span></Td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-charcoal/40">{pick(t.admin.noRequests)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-start font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}
