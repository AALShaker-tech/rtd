"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bilingual } from "@/lib/domain";

/**
 * A captioned help screenshot. Screenshots are per-locale (RTL flips the
 * layout), so the file is read from `public/help/{locale}/{file}`. When the
 * image is missing — which is the default until the team captures it — a
 * labelled placeholder renders instead of a broken image, so the guide never
 * ships fabricated visuals. See `public/help/SCREENSHOTS.md` for the checklist.
 */
export function HelpImage({
  file,
  caption,
  alt,
}: {
  file: string;
  caption: Bilingual;
  alt: Bilingual;
}) {
  const { pick, locale, t } = useI18n();
  const src = `/help/${locale}/${file}`;
  const [failed, setFailed] = useState(false);

  // A new src (e.g. after a language switch) gets a fresh chance to load.
  useEffect(() => setFailed(false), [src]);

  return (
    <figure className="my-4 overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
      {failed ? (
        <div className="flex min-h-[9rem] flex-col items-center justify-center gap-2 bg-ivory-warm p-6 text-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal/25" aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="M21 16l-5-5L5 20" />
          </svg>
          <p className="text-xs font-medium text-charcoal/45">{pick(t.help.imagePending)}</p>
          <p className="text-xs text-charcoal/40">{pick(caption)}</p>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local, may-not-exist help screenshot with a runtime onError fallback; next/image can't express the "missing → placeholder" case here. */}
          <img
            src={src}
            alt={pick(alt)}
            loading="lazy"
            onError={() => setFailed(true)}
            className="block h-auto w-full"
          />
          <figcaption className="border-t border-charcoal/5 px-4 py-2 text-xs text-charcoal/50">
            {pick(caption)}
          </figcaption>
        </>
      )}
    </figure>
  );
}
