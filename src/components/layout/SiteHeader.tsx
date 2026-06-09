"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

/** SAFAR-style dark sticky top bar: RTD logo · language toggle · menu. */
export function SiteHeader() {
  const { t, pick, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: pick(t.nav.home) },
    { href: "/packages", label: pick(t.nav.packages) },
    { href: "/journey", label: pick(t.nav.buildJourney) },
    { href: "/status", label: pick(t.nav.trackRequest) },
  ];

  const Seg = ({ code, label }: { code: "en" | "ar"; label: string }) => (
    <button
      onClick={() => setLocale(code)}
      className="rounded-md px-2.5 py-1 text-[13px] font-semibold transition"
      style={{
        background: locale === code ? "rgba(201,168,106,.18)" : "transparent",
        color: locale === code ? "#c9a86a" : "#8a9499",
      }}
    >
      {label}
    </button>
  );

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{ background: "rgba(11,20,24,.82)", backdropFilter: "blur(12px)", borderColor: "rgba(201,168,106,.22)" }}
    >
      <div className="ink-wrap flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gold-gradient text-ink">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="disp text-[19px] font-bold tracking-[0.5px] text-cream">
            RTD <span className="text-gold">Concierge</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border gold-line">
            <Seg code="ar" label="ع" />
            <Seg code="en" label="EN" />
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg border gold-line p-2 text-gold"
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="ink-wrap flex flex-col gap-1 pb-3 rise">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-[10px] px-3 py-2.5 text-[15px] text-cream transition hover:text-gold"
              style={{ textAlign: locale === "ar" ? "right" : "left" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            onClick={() => setOpen(false)}
            className="rounded-[10px] px-3 py-2.5 text-[13px] text-dim"
            style={{ textAlign: locale === "ar" ? "right" : "left" }}
          >
            {pick(t.nav.staffLogin)}
          </Link>
        </div>
      )}
    </header>
  );
}
