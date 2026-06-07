"use client";

import { REQUEST_STATUSES, type RequestStatus } from "@/lib/domain";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

const TONE: Record<RequestStatus, string> = {
  REQUEST_RECEIVED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  CLIENT_CONTACTED: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  EMPLOYEE_ASSIGNED: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  DRIVER_ASSIGNED: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  CONFIRMED: "bg-gold-50 text-gold-dark ring-1 ring-gold/40",
  IN_PROGRESS: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { locale } = useI18n();
  const label = REQUEST_STATUSES.find((s) => s.value === status)?.name[locale] ?? status;
  return <span className={cn("badge", TONE[status])}>{label}</span>;
}
