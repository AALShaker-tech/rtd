"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export function EmployeeNav({
  user,
  children,
}: {
  user: { fullName: string; role: string };
  children: React.ReactNode;
}) {
  const { t, pick } = useI18n();
  const nav = [{ href: "/employee", label: pick(t.admin.myRequests) }];
  return (
    <DashboardShell title={pick(t.auth.employeeTitle)} nav={nav} user={user}>
      {children}
    </DashboardShell>
  );
}
