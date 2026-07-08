"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/** Light-luxury responsive top bar: inline nav on desktop, drawer on mobile. */
export function SiteHeader() {
  const { t, pick } = useI18n();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: pick(t.nav.home) },
    { href: "/packages", label: pick(t.nav.packages) },
    { href: "/journey", label: pick(t.nav.buildJourney) },
    { href: "/status", label: pick(t.nav.trackRequest) },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/5 bg-ivory/80 backdrop-blur-xl">
      <div className="luxe-container flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" aria-label="RTD home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-charcoal/70 transition hover:text-gold-dark">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/journey" className="btn-gold hidden text-xs md:inline-flex">
            {pick(t.home.ctaBuild)}
          </Link>
          <button className="btn-ghost px-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-charcoal/5 bg-ivory px-5 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium text-charcoal/80">
              {l.label}
            </Link>
          ))}
          <Link href="/admin/login" onClick={() => setOpen(false)} className="block py-2.5 text-xs text-charcoal/40">
            {pick(t.nav.staffLogin)}
          </Link>
        </nav>
      )}
    </header>
  );
}
