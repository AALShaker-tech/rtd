"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export function DriverNav({
  user,
  children,
}: {
  user: { fullName: string; role: string };
  children: React.ReactNode;
}) {
  const { t, pick } = useI18n();
  const nav = [
    { href: "/driver", label: pick(t.admin.myTasks) },
    { href: "/driver/help", label: pick(t.help.nav) },
  ];
  return (
    <DashboardShell title={pick(t.auth.driverTitle)} nav={nav} user={user}>
      {children}
    </DashboardShell>
  );
}
