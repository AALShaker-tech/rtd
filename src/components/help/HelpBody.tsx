"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { HelpBlock } from "@/content/help";
import { HelpImage } from "./HelpImage";

const CALLOUT_TONE: Record<NonNullable<Extract<HelpBlock, { kind: "callout" }>["tone"]>, string> = {
  info: "border-charcoal/10 bg-ivory-warm text-charcoal/75",
  tip: "border-gold/30 bg-gold-50 text-gold-dark",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

/** Renders a help article's block list. Direction (RTL/LTR) is inherited from
 * the document, so ordered lists and callouts flip automatically. */
export function HelpBody({ body }: { body: HelpBlock[] }) {
  const { pick } = useI18n();

  return (
    <div className="space-y-4">
      {body.map((block, i) => {
        switch (block.kind) {
          case "heading":
            return (
              <h2 key={i} className="pt-2 font-serif text-lg font-semibold text-charcoal">
                {pick(block.text)}
              </h2>
            );
          case "paragraph":
            return (
              <p key={i} className="text-sm leading-relaxed text-charcoal/75">
                {pick(block.text)}
              </p>
            );
          case "steps":
            return (
              <ol key={i} className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-charcoal/75 marker:font-medium marker:text-gold-dark">
                {block.items.map((item, j) => (
                  <li key={j} className="ps-1">{pick(item)}</li>
                ))}
              </ol>
            );
          case "bullets":
            return (
              <ul key={i} className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-charcoal/75 marker:text-gold">
                {block.items.map((item, j) => (
                  <li key={j} className="ps-1">{pick(item)}</li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <div key={i} className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", CALLOUT_TONE[block.tone ?? "info"])}>
                {pick(block.text)}
              </div>
            );
          case "link":
            return (
              <div key={i}>
                <Link href={block.href} className="btn-outline px-4 py-2 text-xs">
                  {pick(block.label)}
                  <span aria-hidden className="text-gold-dark">→</span>
                </Link>
              </div>
            );
          case "image":
            return <HelpImage key={i} file={block.file} caption={block.caption} alt={block.alt} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
