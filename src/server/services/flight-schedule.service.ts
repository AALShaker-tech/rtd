import "server-only";
import { prisma } from "@/lib/prisma";
import { AIRPORT_META } from "@/lib/flight-schedule";
import { normalizeFlightNumber, type ResolvedFlight } from "@/lib/flight";

/** Convert a yyyy-mm-dd date to ISO weekday 1=Mon … 7=Sun. */
function isoWeekday(dateISO: string): number {
  const d = new Date(`${dateISO}T00:00:00`);
  return ((d.getDay() + 6) % 7) + 1;
}

/** Estimate arrival (destination local) from departure local + route duration. */
function estimateArrival(
  dateISO: string,
  depTimeLocal: string,
  origin: string,
  destination: string,
  durationMinutes: number,
): { estimatedArrivalDate: string; estimatedArrivalTimeLocal: string } {
  const [h, m] = depTimeLocal.split(":").map(Number);
  const originOff = AIRPORT_META[origin]?.offsetMin ?? 0;
  const destOff = AIRPORT_META[destination]?.offsetMin ?? 0;
  const baseUtc = new Date(`${dateISO}T00:00:00Z`).getTime();
  const depUtc = baseUtc + (h * 60 + m - originOff) * 60_000;
  const arrLocal = new Date(depUtc + (durationMinutes + destOff) * 60_000);
  return {
    estimatedArrivalDate: arrLocal.toISOString().slice(0, 10),
    estimatedArrivalTimeLocal: arrLocal.toISOString().slice(11, 16),
  };
}

/**
 * Resolve a flight code against the static weekly schedule for a given trip date.
 * Returns every match for that weekday (usually one). Empty = not found.
 */
export async function resolveFlight(rawCode: string, dateISO: string): Promise<ResolvedFlight[]> {
  const flightCode = normalizeFlightNumber(rawCode || "");
  if (!flightCode || !dateISO) return [];

  const weekday = isoWeekday(dateISO);
  const rows = await prisma.weeklyFlightSchedule.findMany({
    where: { flightCode, dayOfWeek: weekday, isActive: true },
    include: { route: true, airline: true },
  });

  return rows.map((r) => {
    const arrival = estimateArrival(
      dateISO,
      r.departureTimeLocal,
      r.route.originAirportCode,
      r.route.destinationAirportCode,
      r.route.approxDurationMinutes,
    );
    return {
      flightCode: r.flightCode,
      airline: r.airline.name,
      originAirport: r.route.originAirportCode,
      destinationAirport: r.route.destinationAirportCode,
      departureDate: dateISO,
      departureTimeLocal: r.departureTimeLocal,
      durationMinutes: r.route.approxDurationMinutes,
      lookupSource: "static_schedule",
      lookupStatus: "static_matched",
      ...arrival,
    } satisfies ResolvedFlight;
  });
}

/** Free-text schedule search (admin / debugging). */
export async function searchSchedule(params: {
  origin?: string;
  destination?: string;
  airlineCode?: string;
  flightCode?: string;
  dayOfWeek?: number;
}) {
  const where: any = { isActive: true };
  if (params.flightCode) where.flightCode = normalizeFlightNumber(params.flightCode);
  if (params.airlineCode) where.airline = { code: params.airlineCode };
  if (params.dayOfWeek) where.dayOfWeek = params.dayOfWeek;
  if (params.origin || params.destination) {
    where.route = {};
    if (params.origin) where.route.originAirportCode = params.origin;
    if (params.destination) where.route.destinationAirportCode = params.destination;
  }
  return prisma.weeklyFlightSchedule.findMany({
    where,
    include: { route: true, airline: true },
    orderBy: [{ dayOfWeek: "asc" }, { departureTimeLocal: "asc" }],
    take: 100,
  });
}
