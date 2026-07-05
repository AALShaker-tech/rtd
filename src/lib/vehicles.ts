/**
 * Vehicle catalog — the admin-managed fleet used by the customer flow. The DB
 * (VehicleCategory) is the source of truth; the static VEHICLES constant is a
 * typed fallback so the UI still works before the catalog loads (or if the DB
 * isn't seeded). Mirrors the city-catalog pattern.
 */

import { VEHICLES, type Locale } from "@/lib/domain";

export interface CatalogVehicle {
  category: string;
  nameEn: string;
  nameAr: string;
  maxPassengers: number;
  exampleModels: string;
  descriptionEn: string;
  descriptionAr: string;
  isRecommended: boolean;
  sortOrder: number;
}

/** Fallback fleet derived from the domain constants. */
export const FALLBACK_VEHICLES: CatalogVehicle[] = VEHICLES.map((v) => ({
  category: v.category,
  nameEn: v.name.en,
  nameAr: v.name.ar,
  maxPassengers: v.maxPassengers,
  exampleModels: v.exampleModels,
  descriptionEn: v.description.en,
  descriptionAr: v.description.ar,
  isRecommended: !!v.isRecommended,
  sortOrder: v.sortOrder,
}));

export function vehicleName(v: CatalogVehicle, locale: Locale): string {
  return locale === "ar" ? v.nameAr : v.nameEn;
}

export function vehicleDescription(v: CatalogVehicle, locale: Locale): string {
  return locale === "ar" ? v.descriptionAr : v.descriptionEn;
}

/** The category to pre-select: the recommended one, else the first available. */
export function defaultVehicleCategory(vehicles: CatalogVehicle[]): string | undefined {
  if (!vehicles.length) return undefined;
  return (vehicles.find((v) => v.isRecommended) ?? vehicles[0]).category;
}

/** category → maxPassengers map, for capacity validation. */
export function vehicleCapacityMap(vehicles: CatalogVehicle[]): Record<string, number> {
  return Object.fromEntries(vehicles.map((v) => [v.category, v.maxPassengers]));
}
