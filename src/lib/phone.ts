/**
 * Lightweight international phone validation with first-class Saudi support.
 * Avoids a heavy dependency while still being correct for the markets RTD serves.
 */

export interface CountryDialCode {
  code: string; // ISO country
  dial: string; // dial code incl. +
  name: { en: string; ar: string };
  /** National significant number length (digits after dial code). */
  nsnLength: number[];
}

export const COUNTRY_CODES: CountryDialCode[] = [
  { code: "SA", dial: "+966", name: { en: "Saudi Arabia", ar: "السعودية" }, nsnLength: [9] },
  { code: "AE", dial: "+971", name: { en: "United Arab Emirates", ar: "الإمارات" }, nsnLength: [9] },
  { code: "GB", dial: "+44", name: { en: "United Kingdom", ar: "المملكة المتحدة" }, nsnLength: [10] },
  { code: "FR", dial: "+33", name: { en: "France", ar: "فرنسا" }, nsnLength: [9] },
  { code: "EG", dial: "+20", name: { en: "Egypt", ar: "مصر" }, nsnLength: [10] },
  { code: "US", dial: "+1", name: { en: "United States", ar: "الولايات المتحدة" }, nsnLength: [10] },
  { code: "KW", dial: "+965", name: { en: "Kuwait", ar: "الكويت" }, nsnLength: [8] },
  { code: "QA", dial: "+974", name: { en: "Qatar", ar: "قطر" }, nsnLength: [8] },
  { code: "BH", dial: "+973", name: { en: "Bahrain", ar: "البحرين" }, nsnLength: [8] },
  { code: "OM", dial: "+968", name: { en: "Oman", ar: "عُمان" }, nsnLength: [8] },
];

/** Convert Arabic-Indic digits to ASCII and strip formatting. */
export function normalizeDigits(input: string): string {
  const map: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  };
  return input.replace(/[٠-٩]/g, (d) => map[d] ?? d);
}

export interface PhoneParseResult {
  valid: boolean;
  e164?: string;
  country?: string;
  reason?: "EMPTY" | "FORMAT" | "LENGTH" | "UNKNOWN_COUNTRY";
}

/**
 * Validate and normalise a phone number to E.164.
 * Accepts numbers with a leading + and country code, or a Saudi local form
 * (05xxxxxxxx / 5xxxxxxxx) which is coerced to +9665xxxxxxxx.
 */
export function parsePhone(raw: string, defaultCountry: string = "SA"): PhoneParseResult {
  if (!raw || !raw.trim()) return { valid: false, reason: "EMPTY" };
  let s = normalizeDigits(raw).replace(/[\s\-().]/g, "");

  // Saudi local conventions when no + provided.
  if (!s.startsWith("+")) {
    if (defaultCountry === "SA") {
      if (s.startsWith("00")) s = "+" + s.slice(2);
      else if (s.startsWith("05")) s = "+966" + s.slice(1);
      else if (s.startsWith("5") && s.length === 9) s = "+966" + s;
      else if (s.startsWith("966")) s = "+" + s;
      else s = "+966" + s.replace(/^0/, "");
    } else if (s.startsWith("00")) {
      s = "+" + s.slice(2);
    } else {
      const c = COUNTRY_CODES.find((x) => x.code === defaultCountry);
      if (c) s = c.dial + s.replace(/^0/, "");
    }
  }

  if (!/^\+\d{6,15}$/.test(s)) return { valid: false, reason: "FORMAT" };

  const country = COUNTRY_CODES.find((c) => s.startsWith(c.dial));
  if (!country) {
    // Unknown country but structurally valid E.164 — accept loosely.
    return { valid: true, e164: s, country: undefined };
  }

  const nsn = s.slice(country.dial.length);
  if (!country.nsnLength.includes(nsn.length)) {
    return { valid: false, reason: "LENGTH", country: country.code };
  }

  // Saudi mobile must start with 5.
  if (country.code === "SA" && !nsn.startsWith("5")) {
    return { valid: false, reason: "FORMAT", country: "SA" };
  }

  return { valid: true, e164: s, country: country.code };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Basic IATA-style flight number, e.g. SV021, BA177, EK 7. */
export function isValidFlightNumber(input: string): boolean {
  const s = normalizeDigits(input).toUpperCase().replace(/\s/g, "");
  return /^[A-Z0-9]{2}\d{1,4}[A-Z]?$/.test(s);
}
