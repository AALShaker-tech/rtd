"use server";

import { lookupFlight } from "@/server/services/flight";
import { resolveFlight } from "@/server/services/flight-schedule.service";
import type { ResolvedFlight } from "@/lib/flight";

/**
 * Resolve a flight against the static weekly schedule for a trip date.
 * The client never queries the schedule directly — it calls this action.
 * Returns: matched (1+ rows), or not_found (manual entry stays available).
 */
export async function resolveFlightAction(
  flightCode: string,
  date: string,
): Promise<{ status: "matched"; matches: ResolvedFlight[] } | { status: "not_found" }> {
  const matches = await resolveFlight(flightCode, date);
  if (matches.length === 0) return { status: "not_found" };
  return { status: "matched", matches };
}

/**
 * Generic provider-based lookup (kept for the provider abstraction / future
 * real APIs). The static schedule is the active provider by default.
 */
export async function lookupFlightAction(flightNumber: string, date?: string) {
  return lookupFlight(flightNumber, date);
}
