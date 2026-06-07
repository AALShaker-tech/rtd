"use client";

import { useI18n } from "@/i18n/I18nProvider";

export function AssignedListHeader({ count }: { count: number }) {
  const { t, pick } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.admin.myRequests)}</h1>
      <span className="text-sm text-charcoal/40">{count}</span>
    </div>
  );
}
