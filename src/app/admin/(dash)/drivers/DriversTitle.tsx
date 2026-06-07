"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { StaffManager } from "@/components/dashboard/StaffManager";

export function DriversTitle({ staff }: { staff: Parameters<typeof StaffManager>[0]["staff"] }) {
  const { t, pick } = useI18n();
  return <StaffManager title={pick(t.admin.drivers)} role="DRIVER" staff={staff} countLabel={pick(t.admin.myTasks)} />;
}
