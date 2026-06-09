import "server-only";
import { normalizeFlightNumber, type FlightLookupResult } from "@/lib/flight";
import { notConfigured, type FlightProvider } from "./types";

/**
 * Aviationstack provider (placeholder — activate by setting:
 *   FLIGHT_API_PROVIDER=aviationstack
 *   FLIGHT_API_KEY=...           (access_key)
 *   FLIGHT_API_BASE_URL=http://api.aviationstack.com/v1
 * Docs: https://aviationstack.com/documentation
 */
export const aviationstackProvider: FlightProvider = {
  name: "aviationstack",
  async lookup(raw: string): Promise<FlightLookupResult> {
    const key = process.env.FLIGHT_API_KEY;
    const base = process.env.FLIGHT_API_BASE_URL ?? "http://api.aviationstack.com/v1";
    if (!key) return notConfigured("aviationstack");

    const flightNumber = normalizeFlightNumber(raw);
    try {
      const url = `${base}/flights?access_key=${key}&flight_iata=${encodeURIComponent(flightNumber)}`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) return { ok: false, reason: "PROVIDER_ERROR", message: `HTTP ${res.status}` };
      const json = (await res.json()) as any;
      const f = json?.data?.[0];
      if (!f) return { ok: false, reason: "NOT_FOUND" };

      return {
        ok: true,
        flight: {
          airline: f.airline?.name ?? "Carrier",
          flightNumber,
          departureAirport: f.departure?.iata ?? null,
          arrivalAirport: f.arrival?.iata ?? null,
          departureDateTime: f.departure?.scheduled ?? null,
          arrivalDateTime: f.arrival?.scheduled ?? null,
          departureTerminal: f.departure?.terminal ?? null,
          arrivalTerminal: f.arrival?.terminal ?? null,
          gate: f.departure?.gate ?? null,
          status: f.flight_status ?? null,
          delayMinutes: f.departure?.delay ?? null,
          source: "aviationstack",
        },
      };
    } catch (e) {
      return { ok: false, reason: "PROVIDER_ERROR", message: e instanceof Error ? e.message : "fetch failed" };
    }
  },
};
