import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Date for display in the chosen locale. */
export function formatDateTime(
  value: Date | string | null | undefined,
  locale: "en" | "ar",
  opts: Intl.DateTimeFormatOptions = {},
): string {
  if (!value) return locale === "ar" ? "غير محدد" : "Not set";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return locale === "ar" ? "غير محدد" : "Not set";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    ...opts,
  }).format(date);
}

export function formatDateOnly(value: Date | string | null | undefined, locale: "en" | "ar"): string {
  return formatDateTime(value, locale, { dateStyle: "medium", timeStyle: undefined });
}

/** Build a unique-ish request reference, e.g. RTD-2026-00045. */
export function buildReferenceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `RTD-${year}-${String(sequence).padStart(5, "0")}`;
}

/** Combine a `yyyy-mm-dd` date and `HH:mm` time into a Date, or null. */
export function combineDateTime(date?: string | null, time?: string | null): Date | null {
  if (!date) return null;
  const iso = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
