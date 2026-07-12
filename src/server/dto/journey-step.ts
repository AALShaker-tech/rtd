import "server-only";
import { isoOrNull } from "@/lib/utils";
import type { DisplayStep, DisplayStepVehicle } from "@/components/dashboard/RequestJourney";

/**
 * Prisma `select` covering exactly the fields a `DisplayStep` needs — nothing
 * more (so per-step pricing internals like basePrice/adminAdjustedPrice and raw
 * flightData are never fetched or shipped). Reuse in request queries.
 */
export const displayStepSelect = {
  stepOrder: true,
  stepType: true,
  city: true,
  airport: true,
  terminal: true,
  loungeType: true,
  flightNumber: true,
  scheduledAt: true,
  endAt: true,
  pickupLocation: true,
  dropoffLocation: true,
  hotelName: true,
  hotelAddress: true,
  homeAddress: true,
  serviceType: true,
  carCategory: true,
  passengers: true,
  bags: true,
  additionalVehicles: true,
  days: true,
  dailyHours: true,
  dailyUsage: true,
  skipped: true,
  notes: true,
  flightLookupStatus: true,
  computedPrice: true,
} as const;

/** The raw row shape produced by `displayStepSelect` (dates still as Date). */
interface DisplayStepRow {
  stepOrder: number;
  stepType: string;
  city: string | null;
  airport: string | null;
  terminal: string | null;
  loungeType: string | null;
  flightNumber: string | null;
  scheduledAt: Date | null;
  endAt: Date | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  hotelName: string | null;
  hotelAddress: string | null;
  homeAddress: string | null;
  serviceType: string;
  carCategory: string | null;
  passengers: number | null;
  bags: number | null;
  additionalVehicles: unknown;
  days: number | null;
  dailyHours: number | null;
  dailyUsage: string | null;
  skipped: boolean;
  notes: string | null;
  flightLookupStatus: string | null;
  computedPrice: number | null;
}

/** Normalize the persisted JSON additional-vehicles into a typed, safe array. */
function toDisplayVehicles(raw: unknown): DisplayStepVehicle[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      carCategory: typeof v.carCategory === "string" ? v.carCategory : "",
      passengers: typeof v.passengers === "number" ? v.passengers : null,
      bags: typeof v.bags === "number" ? v.bags : null,
    }))
    .filter((v) => v.carCategory);
}

/** Map a selected journey-step row to the client-facing DisplayStep DTO. */
export function toDisplayStep(s: DisplayStepRow): DisplayStep {
  return {
    stepOrder: s.stepOrder,
    stepType: s.stepType,
    city: s.city,
    airport: s.airport,
    terminal: s.terminal,
    loungeType: s.loungeType,
    flightNumber: s.flightNumber,
    scheduledAt: isoOrNull(s.scheduledAt),
    endAt: isoOrNull(s.endAt),
    pickupLocation: s.pickupLocation,
    dropoffLocation: s.dropoffLocation,
    hotelName: s.hotelName,
    hotelAddress: s.hotelAddress,
    homeAddress: s.homeAddress,
    serviceType: s.serviceType,
    carCategory: s.carCategory,
    passengers: s.passengers,
    bags: s.bags,
    additionalVehicles: toDisplayVehicles(s.additionalVehicles),
    days: s.days,
    dailyHours: s.dailyHours,
    dailyUsage: s.dailyUsage,
    skipped: s.skipped,
    notes: s.notes,
    flightLookupStatus: s.flightLookupStatus,
    computedPrice: s.computedPrice,
  };
}
