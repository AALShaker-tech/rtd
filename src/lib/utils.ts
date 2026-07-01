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

/**
 * Serialize a server-fetched object (typically a Prisma record) for passing
 * across the Server Component → Client Component boundary. Deep-clones via JSON,
 * which turns non-serializable values into their JSON form (Date → ISO string).
 * Centralizes what used to be scattered `JSON.parse(JSON.stringify(x))` calls.
 *
 * The return type is intentionally loose: JSON round-tripping changes the shape
 * (Date fields become strings), and the client components are typed against that
 * post-serialization shape. Callers assign the result to their own prop type.
 *
 * NOTE: this clones the whole object — it does not trim fields. Narrowing each
 * view to an explicit DTO / Prisma `select` is a worthwhile follow-up so that
 * internal-only fields aren't shipped to the client.
 */
export function serialize(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

/**
 * ISO string for a Date (or null) — used when mapping a Prisma row to a DTO for
 * a Client Component, whose date fields are typed as strings (the JSON shape).
 * Matches what `JSON.stringify` produced, so downstream parsing is unchanged.
 */
export function isoOrNull(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/** Combine a `yyyy-mm-dd` date and `HH:mm` time into a Date, or null. */
export function combineDateTime(date?: string | null, time?: string | null): Date | null {
  if (!date) return null;
  const iso = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
