"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export function AdminNav({
  user,
  children,
}: {
  user: { fullName: string; role: string };
  children: React.ReactNode;
}) {
  const { t, pick } = useI18n();
  const nav = [
    { href: "/admin", label: pick(t.admin.overview) },
    { href: "/admin/requests", label: pick(t.admin.requests) },
    { href: "/admin/pricing", label: pick(t.pricing.servicePricing) },
    { href: "/admin/cities", label: pick(t.cities.title) },
    { href: "/admin/employees", label: pick(t.admin.employees) },
    { href: "/admin/drivers", label: pick(t.admin.drivers) },
    { href: "/admin/settings", label: pick(t.admin.settings) },
  ];
  return (
    <DashboardShell title={pick(t.auth.adminTitle)} nav={nav} user={user}>
      {children}
    </DashboardShell>
  );
}
