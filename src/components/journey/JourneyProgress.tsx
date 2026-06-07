"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "build", en: "Build", ar: "التصميم" },
  { key: "details", en: "Details", ar: "البيانات" },
  { key: "verify", en: "Verify", ar: "التأكيد" },
  { key: "review", en: "Review", ar: "المراجعة" },
] as const;

export function JourneyProgress({ current }: { current: (typeof STAGES)[number]["key"] }) {
  const { locale } = useI18n();
  const idx = STAGES.findIndex((s) => s.key === current);

  return (
    <div className="mx-auto mb-10 flex max-w-2xl items-center justify-between">
      {STAGES.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition",
                  done && "border-gold bg-gold-gradient text-charcoal",
                  active && "border-gold bg-charcoal text-gold-light",
                  !done && !active && "border-charcoal/15 bg-white text-charcoal/40",
                )}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={cn("text-xs font-medium", active ? "text-charcoal" : "text-charcoal/40")}>
                {locale === "ar" ? s.ar : s.en}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn("mx-2 h-px flex-1 transition", done ? "bg-gold" : "bg-charcoal/10")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
