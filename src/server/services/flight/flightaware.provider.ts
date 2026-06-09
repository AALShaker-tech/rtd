import "server-only";
import { type FlightLookupResult } from "@/lib/flight";
import { notConfigured, type FlightProvider } from "./types";

/**
 * FlightAware AeroAPI provider (placeholder — activate by setting:
 *   FLIGHT_API_PROVIDER=flightaware
 *   FLIGHT_API_KEY=...                (x-apikey header)
 *   FLIGHT_API_BASE_URL=https://aeroapi.flightaware.com/aeroapi
 * Docs: https://www.flightaware.com/aeroapi/
 * Call GET /flights/{ident} with header `x-apikey`, then map the first segment
 * into NormalizedFlight below.
 */
export const flightawareProvider: FlightProvider = {
  name: "flightaware",
  async lookup(): Promise<FlightLookupResult> {
    const key = process.env.FLIGHT_API_KEY;
    if (!key) return notConfigured("flightaware");
    // TODO: GET {base}/flights/{ident} with `x-apikey`; normalize the response.
    return { ok: false, reason: "PROVIDER_ERROR", message: "FlightAware integration not yet implemented." };
  },
};
