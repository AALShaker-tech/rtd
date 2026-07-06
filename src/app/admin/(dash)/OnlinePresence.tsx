"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { getOnlineUsers, type OnlineUser } from "@/server/actions/presence.actions";

const ROLE_LABEL: Record<string, { en: string; ar: string }> = {
  SUPERADMIN: { en: "Superadmin", ar: "مسؤول أعلى" },
  ADMIN: { en: "Admin", ar: "مسؤول" },
  EMPLOYEE: { en: "Employee", ar: "موظف" },
  DRIVER: { en: "Driver", ar: "سائق" },
};

const POLL_MS = 30_000;

export function OnlinePresence({ initial }: { initial: OnlineUser[] }) {
  const { t, pick, locale } = useI18n();
  const [online, setOnline] = useState<OnlineUser[]>(initial);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await getOnlineUsers();
        if (active) setOnline(res);
      } catch {
        // transient — keep the last known list until the next poll
      }
    }
    const id = setInterval(load, POLL_MS);
    // Refresh once shortly after mount too, so it doesn't wait a full interval.
    const kick = setTimeout(load, 2_000);
    return () => {
      active = false;
      clearInterval(id);
      clearTimeout(kick);
    };
  }, []);

  return (
    <div className="luxe-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        <h3 className="font-serif text-lg font-semibold text-charcoal">
          {pick(t.admin.whoOnline)}
        </h3>
        <span className="text-sm text-charcoal/40">({online.length})</span>
      </div>
      {online.length === 0 ? (
        <p className="text-sm text-charcoal/40">{pick(t.admin.noOneOnline)}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {online.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-2 rounded-full bg-ivory-warm px-3 py-1.5 text-sm"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="font-medium text-charcoal">{u.fullName}</span>
              <span className="text-xs text-charcoal/40">
                {ROLE_LABEL[u.role]?.[locale] ?? u.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
