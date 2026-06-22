/**
 * Service timing — derives suggested times for each journey step from the trip
 * dates and resolved flight times, using configurable buffers. Pure & shared by
 * client (display) and server (persisted times). Buffers live here (config),
 * never inside UI components, and can be made admin-editable later.
 */

import type { StepType } from "@/lib/domain";
import type { ResolvedFlight } from "@/lib/flight";

/** All buffers in minutes. */
export const SERVICE_TIME_BUFFERS = {
  homePickupBeforeDeparture: 240, // 4h before international departure
  riyadhDepartureAssistBefore: 180, // 3h before departure
  arrivalClearanceAfterArrival: 60, // 60 min after landing (airport → hotel / home)
  hotelToAirportBeforeDeparture: 240, // 4h before return departure
  returnDepartureAssistBefore: 180, // 3h before return departure
} as const;

export interface TimingInputs {
  departureDate?: string;
  returnDate?: string;
  /** Manual fallback times when no flight was resolved. */
  departureTime?: string;
  returnTime?: string;
}

export interface EstimatedTime {
  date?: string; // yyyy-mm-dd
  time?: string; // HH:MM
}

function shift(date: string | undefined, time: string | undefined, deltaMin: number): EstimatedTime {
  if (!date || !time) return { date, time };
  const base = new Date(`${date}T00:00:00Z`).getTime();
  const [h, m] = time.split(":").map(Number);
  const result = new Date(base + (h * 60 + m + deltaMin) * 60_000);
  return { date: result.toISOString().slice(0, 10), time: result.toISOString().slice(11, 16) };
}

/**
 * Suggested time for a step. depFlight/retFlight are the resolved flights (or
 * null → manual times are used as the flight time).
 */
export function estimateServiceTime(
  stepType: StepType,
  trip: TimingInputs,
  depFlight?: ResolvedFlight | null,
  retFlight?: ResolvedFlight | null,
): EstimatedTime {
  const B = SERVICE_TIME_BUFFERS;
  const depDate = depFlight?.departureDate ?? trip.departureDate;
  const depTime = depFlight?.departureTimeLocal ?? trip.departureTime;
  const retDate = retFlight?.departureDate ?? trip.returnDate;
  const retTime = retFlight?.departureTimeLocal ?? trip.returnTime;

  switch (stepType) {
    case "HOME_TO_RIYADH_AIRPORT":
      return shift(depDate, depTime, -B.homePickupBeforeDeparture);
    case "DEPARTURE_ASSIST_RIYADH":
      return shift(depDate, depTime, -B.riyadhDepartureAssistBefore);
    case "ARRIVAL_ASSIST_DESTINATION":
      // Arrival time is only meaningful from a resolved flight. Without one we
      // leave the time empty (the customer enters it) instead of faking it.
      return depFlight
        ? { date: depFlight.estimatedArrivalDate, time: depFlight.estimatedArrivalTimeLocal }
        : { date: depDate };
    case "AIRPORT_TO_HOTEL":
      return depFlight
        ? shift(depFlight.estimatedArrivalDate, depFlight.estimatedArrivalTimeLocal, B.arrivalClearanceAfterArrival)
        : { date: depDate };
    case "CHAUFFEUR_DURING_STAY":
      // Starts on the chauffeur start date (handled per-step); no clock estimate.
      return { date: depFlight?.estimatedArrivalDate ?? depDate };
    case "HOTEL_TO_AIRPORT":
      return shift(retDate, retTime, -B.hotelToAirportBeforeDeparture);
    case "DEPARTURE_ASSIST_RETURN":
      return shift(retDate, retTime, -B.returnDepartureAssistBefore);
    case "ARRIVAL_ASSIST_RIYADH":
      return retFlight
        ? { date: retFlight.estimatedArrivalDate, time: retFlight.estimatedArrivalTimeLocal }
        : { date: retDate };
    case "RIYADH_AIRPORT_TO_HOME":
      return retFlight
        ? shift(retFlight.estimatedArrivalDate, retFlight.estimatedArrivalTimeLocal, B.arrivalClearanceAfterArrival)
        : { date: retDate };
    default:
      return {};
  }
}
