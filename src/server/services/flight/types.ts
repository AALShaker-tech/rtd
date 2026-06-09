import "server-only";
import type { FlightLookupResult } from "@/lib/flight";

/**
 * A flight data provider. Implementations must return the normalized shape and
 * must never throw for "not found" — they return a structured failure instead.
 */
export interface FlightProvider {
  readonly name: string;
  lookup(flightNumber: string, date?: string): Promise<FlightLookupResult>;
}

/** Helper for placeholder providers that aren't configured yet. */
export function notConfigured(provider: string): FlightLookupResult {
  return {
    ok: false,
    reason: "PROVIDER_ERROR",
    message: `Flight provider "${provider}" is not configured. Set FLIGHT_API_KEY / FLIGHT_API_BASE_URL.`,
  };
}
