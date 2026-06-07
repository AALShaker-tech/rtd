"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { locale, setLocale } = useI18n();
  const base = variant === "light" ? "text-ivory/70" : "text-charcoal/60";
  const active = variant === "light" ? "bg-ivory/15 text-ivory" : "bg-charcoal text-ivory";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 text-xs font-medium",
        variant === "light" ? "border-ivory/20" : "border-charcoal/15",
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={cn("rounded-full px-3 py-1 transition", locale === "en" ? active : base)}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("ar")}
        className={cn("rounded-full px-3 py-1 transition", locale === "ar" ? active : base)}
      >
        عربي
      </button>
    </div>
  );
}
