import "server-only";
import { prisma } from "@/lib/prisma";
import { AIRPORT_META, parseFlightSchedule, routeDuration } from "@/lib/flight-schedule";
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

/** Build a ResolvedFlight from a route + departure time. */
function buildResolved(
  flightCode: string,
  airline: string,
  origin: string,
  destination: string,
  dateISO: string,
  depTimeLocal: string,
  durationMinutes: number,
): ResolvedFlight {
  return {
    flightCode,
    airline,
    originAirport: origin,
    destinationAirport: destination,
    departureDate: dateISO,
    departureTimeLocal: depTimeLocal,
    durationMinutes,
    lookupSource: "static_schedule",
    lookupStatus: "static_matched",
    ...estimateArrival(dateISO, depTimeLocal, origin, destination, durationMinutes),
  };
}

/** Resolve from the bundled CSV (fallback when the DB schedule isn't seeded). */
function resolveFromCsv(flightCode: string, weekday: number, dateISO: string): ResolvedFlight[] {
  return parseFlightSchedule()
    .filter((r) => r.flightCode === flightCode && r.dayOfWeek === weekday)
    .map((r) =>
      buildResolved(
        r.flightCode,
        r.airlineName,
        r.origin,
        r.destination,
        dateISO,
        r.departureTimeLocal,
        routeDuration(r.origin, r.destination),
      ),
    );
}

/**
 * Resolve a flight code against the static weekly schedule for a given trip date.
 * Returns every match for that weekday (usually one). Empty = not found.
 *
 * Primary source is the DB (WeeklyFlightSchedule); if the DB has no matching
 * rows we fall back to the bundled CSV (same authoritative data) so lookup works
 * even when the database hasn't been seeded (e.g. a fresh deployment).
 */
export async function resolveFlight(rawCode: string, dateISO: string): Promise<ResolvedFlight[]> {
  const flightCode = normalizeFlightNumber(rawCode || "");
  if (!flightCode || !dateISO) return [];

  const weekday = isoWeekday(dateISO);

  let rows: Array<{
    flightCode: string;
    departureTimeLocal: string;
    route: { originAirportCode: string; destinationAirportCode: string; approxDurationMinutes: number };
    airline: { name: string };
  }> = [];
  try {
    rows = await prisma.weeklyFlightSchedule.findMany({
      where: { flightCode, dayOfWeek: weekday, isActive: true },
      include: { route: true, airline: true },
    });
  } catch {
    rows = [];
  }

  if (rows.length === 0) {
    // DB miss (no match, or table not seeded) → resolve from the bundled CSV.
    return resolveFromCsv(flightCode, weekday, dateISO);
  }

  return rows.map((r) =>
    buildResolved(
      r.flightCode,
      r.airline.name,
      r.route.originAirportCode,
      r.route.destinationAirportCode,
      dateISO,
      r.departureTimeLocal,
      r.route.approxDurationMinutes,
    ),
  );
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
