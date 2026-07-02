"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { getOpsNotifications } from "@/server/actions/notifications.actions";
import { countUnread, type NotificationItem } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

export function NotificationBell({ role }: { role: string }) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const seenKey = `rtd_notif_seen_${role}`;

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setLastSeen(localStorage.getItem(seenKey));
    } catch {
      /* localStorage unavailable — treat as never seen */
    }
  }, [seenKey]);

  const load = useCallback(async () => {
    try {
      const res = await getOpsNotifications();
      setItems(res.items);
    } catch {
      /* keep the last successful list */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const unread = countUnread(items, lastSeen);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = new Date().toISOString();
      setLastSeen(now);
      try {
        localStorage.setItem(seenKey, now);
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={ar ? "الإشعارات" : "Notifications"}
        className="relative grid h-9 w-9 place-items-center rounded-xl text-charcoal/70 transition hover:bg-charcoal/5 hover:text-charcoal"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-charcoal">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute end-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-charcoal/5 px-4 py-3">
              <span className="text-sm font-semibold text-charcoal">{ar ? "الإشعارات" : "Notifications"}</span>
              {items.length > 0 && (
                <span className="text-xs text-charcoal/40">
                  {items.length} {ar ? "بحاجة إلى إجراء" : "to action"}
                </span>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-charcoal/40">
                {ar ? "لا يوجد جديد" : "Nothing new"}
              </p>
            ) : (
              <ul className="max-h-96 overflow-auto">
                {items.map((it) => {
                  const isUnread = !lastSeen || Date.parse(it.createdAt) > Date.parse(lastSeen);
                  return (
                    <li key={it.id} className="border-b border-charcoal/5 last:border-0">
                      <Link
                        href={it.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 transition hover:bg-ivory-warm",
                          isUnread && "bg-gold/5",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            isUnread ? "bg-gold" : "bg-transparent",
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block font-mono text-xs text-charcoal/60">{it.referenceNumber}</span>
                          <span className="block truncate text-sm text-charcoal">{it.title}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
