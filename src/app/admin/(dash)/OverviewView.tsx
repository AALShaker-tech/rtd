"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { getCity, getVehicle, type CarCategory, type RequestStatus } from "@/lib/domain";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

interface Props {
  metrics: {
    total: number;
    received: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    unassigned: number;
    pendingVerification: number;
    upcomingToday: number;
  };
  byCity: { city: string; count: number }[];
  byCategory: { category: CarCategory; count: number }[];
  recent: { referenceNumber: string; name: string; status: RequestStatus; createdAt: Date | string }[];
}

export function OverviewView({ metrics, byCity, byCategory, recent }: Props) {
  const { t, pick, locale } = useI18n();

  const cards = [
    { label: pick(t.admin.totalRequests), value: metrics.total, accent: "from-charcoal to-charcoal-800" },
    { label: pick(t.admin.newRequests), value: metrics.received, accent: "from-blue-500 to-blue-600" },
    { label: pick(t.admin.confirmed), value: metrics.confirmed, accent: "from-gold to-gold-dark" },
    { label: pick(t.admin.completed), value: metrics.completed, accent: "from-emerald-500 to-emerald-600" },
    { label: pick(t.admin.cancelled), value: metrics.cancelled, accent: "from-red-400 to-red-500" },
    { label: pick(t.admin.unassigned), value: metrics.unassigned, accent: "from-purple-500 to-purple-600" },
    { label: pick(t.admin.pendingVerification), value: metrics.pendingVerification, accent: "from-amber-400 to-amber-500" },
    { label: pick(t.admin.upcomingToday), value: metrics.upcomingToday, accent: "from-teal-500 to-teal-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="luxe-card overflow-hidden p-5">
            <div className={`mb-3 h-1 w-10 rounded-full bg-gradient-to-r ${c.accent}`} />
            <p className="text-3xl font-bold text-charcoal">{c.value}</p>
            <p className="mt-1 text-sm text-charcoal/50">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="luxe-card p-5">
          <h3 className="mb-4 font-serif text-lg font-semibold text-charcoal">{pick(t.admin.byCity)}</h3>
          <DistList items={byCity.map((c) => ({ label: getCity(c.city)?.name[locale] ?? c.city, count: c.count }))} />
        </div>
        <div className="luxe-card p-5">
          <h3 className="mb-4 font-serif text-lg font-semibold text-charcoal">{pick(t.admin.byCategory)}</h3>
          <DistList items={byCategory.map((c) => ({ label: getVehicle(c.category).name[locale], count: c.count }))} />
        </div>
        <div className="luxe-card p-5 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-charcoal">{pick(t.admin.requests)}</h3>
            <Link href="/admin/requests" className="text-xs text-gold-dark hover:underline">
              {pick(t.common.all)} →
            </Link>
          </div>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.referenceNumber}>
                <Link
                  href={`/admin/requests/${r.referenceNumber}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-ivory-warm"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-charcoal">{r.referenceNumber}</p>
                    <p className="text-xs text-charcoal/50">{r.name}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
            {recent.length === 0 && <li className="py-4 text-center text-sm text-charcoal/40">{pick(t.admin.noRequests)}</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DistList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <p className="text-sm text-charcoal/40">—</p>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-charcoal/70">{i.label}</span>
            <span className="font-medium text-charcoal">{i.count}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-charcoal/5">
            <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
