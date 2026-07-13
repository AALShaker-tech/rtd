"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { logout } from "@/server/actions/auth.actions";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function DashboardShell({
  title,
  nav,
  user,
  children,
}: {
  title: string;
  nav: NavItem[];
  user: { fullName: string; role: string };
  children: React.ReactNode;
}) {
  const { t, pick } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 px-2">
        <Logo variant="light" />
        <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-gold-light/60">{title}</p>
      </div>
      {nav.map((n) => {
        // A dashboard root (single path segment, e.g. "/admin", "/employee",
        // "/driver") is a prefix of every page under it, so it only counts as
        // active on an exact match; deeper items match their sub-routes too.
        const isRoot = /^\/[^/]+$/.test(n.href);
        const active = pathname === n.href || (!isRoot && pathname.startsWith(n.href));
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-gold-gradient text-charcoal" : "text-ivory/70 hover:bg-white/5 hover:text-ivory",
            )}
          >
            {n.icon}
            {n.label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-3 border-t border-ivory/10 pt-4">
        <div className="px-2">
          <p className="text-sm font-medium text-ivory">{user.fullName}</p>
          <p className="text-xs text-ivory/40">{user.role}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="w-full rounded-xl px-3 py-2 text-start text-sm text-ivory/60 hover:bg-white/5 hover:text-ivory">
            {pick(t.auth.signOut)}
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-ivory">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 hidden w-64 bg-charcoal-gradient lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-charcoal/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-64 bg-charcoal-gradient">{sidebar}</aside>
        </div>
      )}

      {/* Content */}
      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-charcoal/5 bg-ivory/85 px-5 backdrop-blur-xl">
          <button className="btn-ghost px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-serif text-lg font-semibold text-charcoal">{title}</span>
          <div className="flex items-center gap-1">
            <NotificationBell role={user.role} />
            <LanguageSwitcher />
          </div>
        </header>
        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
