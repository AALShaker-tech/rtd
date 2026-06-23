import "server-only";
import { normalizeFlightNumber, type NormalizedFlight } from "@/lib/flight";
import type { FlightProvider } from "./types";

const AIRLINES: Record<string, string> = {
  SV: "Saudia",
  XY: "flynas",
  F3: "flyadeal",
  BA: "British Airways",
  QR: "Qatar Airways",
  EK: "Emirates",
  AF: "Air France",
  MS: "EgyptAir",
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deterministic mock provider — produces stable, plausible flight details from
 * the flight number so the UI is fully functional without external credentials.
 */
export const mockProvider: FlightProvider = {
  name: "mock",
  async lookup(raw: string): Promise<{ ok: true; flight: NormalizedFlight }> {
    const code = normalizeFlightNumber(raw) || "SV123";
    const h = hash(code);
    const prefix = (code.match(/^[A-Z]{2}/) || ["SV"])[0];
    const terminals = ["1", "2", "3", "5"];
    const gates = ["A12", "B7", "C24", "D3", "E18", "F9"];
    const depHour = 6 + (h % 14);
    const depMin = (h % 4) * 15;
    const delay = [0, 0, 15, 40][h % 4];

    const today = new Date();
    const dep = new Date(today);
    dep.setHours(depHour, depMin, 0, 0);
    const arr = new Date(dep.getTime() + (3 + (h % 6)) * 3.6e6);

    await new Promise((r) => setTimeout(r, 400));

    return {
      ok: true,
      flight: {
        airline: AIRLINES[prefix] ?? "Carrier",
        flightNumber: code,
        departureAirport: "RUH",
        arrivalAirport: ["LHR", "DXB", "CAI", "CDG"][h % 4],
        departureDateTime: dep.toISOString(),
        arrivalDateTime: arr.toISOString(),
        departureTerminal: terminals[h % terminals.length],
        arrivalTerminal: terminals[(h >> 2) % terminals.length],
        gate: gates[h % gates.length],
        status: delay > 0 ? "Delayed" : "On time",
        delayMinutes: delay,
        source: "mock",
      },
    };
  },
};
