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
    { href: "/admin/services", label: pick(t.admin.services) },
    { href: "/admin/pricing", label: pick(t.pricing.vehiclePricing) },
    { href: "/admin/lounges", label: pick(t.lounges.navTitle) },
    { href: "/admin/packages", label: pick(t.packages.title) },
    { href: "/admin/cities", label: pick(t.cities.nav) },
    { href: "/admin/employees", label: pick(t.admin.employees) },
    { href: "/admin/drivers", label: pick(t.admin.drivers) },
    // Managing admin accounts is reserved for the superadmin.
    ...(user.role === "SUPERADMIN" ? [{ href: "/admin/admins", label: pick(t.admin.admins) }] : []),
    { href: "/admin/settings", label: pick(t.admin.settings) },
    { href: "/admin/help", label: pick(t.help.nav) },
  ];
  return (
    <DashboardShell title={pick(t.auth.adminTitle)} nav={nav} user={user}>
      {children}
    </DashboardShell>
  );
}
