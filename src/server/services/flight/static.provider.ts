import "server-only";
import { normalizeFlightNumber, type FlightLookupResult } from "@/lib/flight";
import { resolveFlight } from "@/server/services/flight-schedule.service";
import type { FlightProvider } from "./types";

/**
 * Active provider: resolves flights from the static weekly schedule seeded from
 * the CSV. Returns the first match for the given date as the normalized shape.
 * (The Trip Information UI uses resolveFlightAction directly for multi-match.)
 */
export const staticScheduleProvider: FlightProvider = {
  name: "static_schedule",
  async lookup(rawCode: string, date?: string): Promise<FlightLookupResult> {
    const flightCode = normalizeFlightNumber(rawCode || "");
    if (!date) return { ok: false, reason: "INVALID_INPUT", message: "A trip date is required to resolve the schedule." };
    const matches = await resolveFlight(flightCode, date);
    if (matches.length === 0) return { ok: false, reason: "NOT_FOUND" };
    const f = matches[0];
    return {
      ok: true,
      flight: {
        airline: f.airline,
        flightNumber: f.flightCode,
        departureAirport: f.originAirport,
        arrivalAirport: f.destinationAirport,
        departureDateTime: `${f.departureDate}T${f.departureTimeLocal}:00`,
        arrivalDateTime: `${f.estimatedArrivalDate}T${f.estimatedArrivalTimeLocal}:00`,
        departureTerminal: null,
        arrivalTerminal: null,
        gate: null,
        status: "Scheduled",
        delayMinutes: null,
        source: "static_schedule",
      },
    };
  },
};
