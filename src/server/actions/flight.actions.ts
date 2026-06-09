"use server";

import { lookupFlight } from "@/server/services/flight";

/**
 * Client-callable flight lookup. The client never talks to the flight API
 * directly — it calls this action, which uses the configured backend provider.
 */
export async function lookupFlightAction(flightNumber: string, date?: string) {
  return lookupFlight(flightNumber, date);
}
