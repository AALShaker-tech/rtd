import "server-only";
import { normalizeFlightNumber, type FlightLookupResult } from "@/lib/flight";
import { aviationstackProvider } from "./aviationstack.provider";
import { amadeusProvider } from "./amadeus.provider";
import { flightawareProvider } from "./flightaware.provider";
import { mockProvider } from "./mock.provider";
import { staticScheduleProvider } from "./static.provider";
import type { FlightProvider } from "./types";

/**
 * Resolve the active provider. FLIGHT_LOOKUP_PROVIDER selects the implementation
 * (the static schedule is the active default); FLIGHT_API_PROVIDER kept as a
 * legacy fallback for the future real-API providers.
 */
function resolveProvider(): FlightProvider {
  const selected = (process.env.FLIGHT_LOOKUP_PROVIDER ?? process.env.FLIGHT_API_PROVIDER ?? "static_schedule").toLowerCase();
  switch (selected) {
    case "aviationstack":
      return aviationstackProvider;
    case "amadeus":
      return amadeusProvider;
    case "flightaware":
      return flightawareProvider;
    case "mock":
      return mockProvider;
    default:
      return staticScheduleProvider;
  }
}

/**
 * Look up a flight via the configured provider. Never throws — returns a
 * structured result so the caller can fall back to manual entry gracefully.
 */
export async function lookupFlight(raw: string, date?: string): Promise<FlightLookupResult> {
  const flightNumber = normalizeFlightNumber(raw ?? "");
  if (!/^[A-Z0-9]{2}\d{1,4}[A-Z]?$/.test(flightNumber)) {
    return { ok: false, reason: "INVALID_INPUT" };
  }
  try {
    return await resolveProvider().lookup(flightNumber, date);
  } catch (e) {
    return { ok: false, reason: "PROVIDER_ERROR", message: e instanceof Error ? e.message : "lookup failed" };
  }
}

export { resolveProvider };
