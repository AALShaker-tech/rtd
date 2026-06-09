/**
 * Shared flight-lookup types. The normalized format below is the single shape
 * the rest of the app consumes, regardless of which provider produced it.
 */

export interface NormalizedFlight {
  airline: string;
  flightNumber: string;
  departureAirport: string | null;
  arrivalAirport: string | null;
  departureDateTime: string | null; // ISO
  arrivalDateTime: string | null; // ISO
  departureTerminal: string | null;
  arrivalTerminal: string | null;
  gate: string | null;
  status: string | null;
  delayMinutes: number | null;
  /** Which provider produced this (e.g. "mock", "aviationstack"). */
  source: string;
}

export type FlightLookupResult =
  | { ok: true; flight: NormalizedFlight }
  | { ok: false; reason: "NOT_FOUND" | "PROVIDER_ERROR" | "INVALID_INPUT"; message?: string };

/** Normalize a raw flight-number string (Arabic digits, spacing, case). */
export function normalizeFlightNumber(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .toUpperCase()
    .replace(/\s+/g, "");
}
