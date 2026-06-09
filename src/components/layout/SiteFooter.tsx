"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { WHATSAPP_DISPLAY, whatsappContactLink } from "@/lib/whatsapp";

export function SiteFooter() {
  const { t, pick, locale } = useI18n();
  return (
    <footer className="relative z-[1] mt-16 border-t gold-line">
      <div className="ink-wrap py-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gold-gradient text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M2 16l20-7-7 20-3-8-8-3z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="disp text-lg font-bold text-cream">
            RTD <span className="text-gold">Concierge</span>
          </span>
        </div>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-dim">{pick(t.brand.tagline)}</p>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-dim">
          <Link href="/journey" className="hover:text-gold">{pick(t.nav.buildJourney)}</Link>
          <Link href="/packages" className="hover:text-gold">{pick(t.nav.packages)}</Link>
          <Link href="/status" className="hover:text-gold">{pick(t.nav.trackRequest)}</Link>
          <a href={whatsappContactLink()} target="_blank" rel="noreferrer" className="hover:text-gold">
            WhatsApp · {WHATSAPP_DISPLAY}
          </a>
        </div>

        <p className="mt-6 text-xs text-dim/70">
          © {new Date().getFullYear()} RTD Concierge. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
