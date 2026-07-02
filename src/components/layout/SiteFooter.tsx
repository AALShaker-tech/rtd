"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { Logo } from "@/components/ui/Logo";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER, whatsappContactLink } from "@/lib/whatsapp";

export function SiteFooter({
  whatsappNumber = WHATSAPP_NUMBER,
  whatsappDisplay = WHATSAPP_DISPLAY,
}: {
  whatsappNumber?: string;
  whatsappDisplay?: string;
}) {
  const { t, pick, locale } = useI18n();
  return (
    <footer className="mt-20 lux-dark">
      <div className="luxe-container grid gap-10 py-14 md:grid-cols-3">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/60">
            {pick(t.brand.tagline)}
          </p>
        </div>
        <div className="text-sm">
          <h4 className="mb-3 font-serif text-gold-light">{pick(t.nav.buildJourney)}</h4>
          <ul className="space-y-2 text-ivory/60">
            <li>
              <Link href="/journey" className="hover:text-gold-light">
                {pick(t.nav.buildJourney)}
              </Link>
            </li>
            <li>
              <Link href="/packages" className="hover:text-gold-light">
                {pick(t.nav.packages)}
              </Link>
            </li>
            <li>
              <Link href="/status" className="hover:text-gold-light">
                {pick(t.nav.trackRequest)}
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-gold-light">
                {pick(t.nav.staffLogin)}
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="mb-3 font-serif text-gold-light">
            {locale === "ar" ? "تواصل معنا" : "Contact"}
          </h4>
          <a
            href={whatsappContactLink(whatsappNumber)}
            target="_blank"
            rel="noreferrer"
            className="text-ivory/70 hover:text-gold-light"
          >
            WhatsApp: {whatsappDisplay}
          </a>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-5 text-center text-xs text-ivory/40">
        © {new Date().getFullYear()} RTD Concierge.{" "}
        {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
      </div>
    </footer>
  );
}
