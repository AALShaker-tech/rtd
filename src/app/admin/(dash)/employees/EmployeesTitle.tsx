"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { StaffManager } from "@/components/dashboard/StaffManager";

export function EmployeesTitle({ staff }: { staff: Parameters<typeof StaffManager>[0]["staff"] }) {
  const { t, pick } = useI18n();
  return <StaffManager title={pick(t.admin.employees)} role="EMPLOYEE" staff={staff} countLabel={pick(t.admin.requests)} />;
}
