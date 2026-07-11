/**
 * City catalog — the admin-managed list of cities used by the customer flow.
 * The DB is the source of truth; the domain constants provide a fallback so the
 * UI still works before the catalog loads (or if the DB isn't seeded yet).
 */

import {
  CITIES,
  type Locale,
} from "@/lib/domain";

export interface CatalogAirportLounge {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
}

export interface CatalogAirport {
  code: string;
  nameEn: string;
  nameAr: string;
  terminals: string[];
  /** Enabled lounges offered at this airport, with their per-airport price. */
  lounges: CatalogAirportLounge[];
}

export interface CatalogCity {
  code: string;
  nameEn: string;
  nameAr: string;
  country: string;
  isOrigin: boolean;
  /** Admin-chosen landmark icon preset key (see CityLandmark). */
  landmarkKey?: string | null;
  airports: CatalogAirport[];
  /** Journey step types disabled for this city. */
  disabledSteps: string[];
  /** Vehicle categories disabled for this city. */
  disabledVehicles: string[];
}

export interface Catalog {
  cities: CatalogCity[];
}

/** Fallback catalog derived from the domain constants. */
export const FALLBACK_CATALOG: Catalog = {
  cities: CITIES.map((c) => ({
    code: c.code,
    nameEn: c.name.en,
    nameAr: c.name.ar,
    country: c.country,
    isOrigin: !!c.isOrigin,
    landmarkKey: null,
    airports: c.airports.map((a) => ({ code: a.code, nameEn: a.name.en, nameAr: a.name.ar, terminals: a.terminals, lounges: [] })),
    disabledSteps: [],
    disabledVehicles: [],
  })),
};

export function catalogCity(catalog: Catalog, code?: string | null): CatalogCity | undefined {
  if (!code) return undefined;
  return catalog.cities.find((c) => c.code === code);
}

/** Resolve a city's display name from the catalog, falling back to the code. */
export function catalogCityName(catalog: Catalog, code: string | null | undefined, locale: Locale): string {
  if (!code) return "";
  const c = catalogCity(catalog, code);
  if (c) return locale === "ar" ? c.nameAr : c.nameEn;
  // domain fallback
  const dc = CITIES.find((x) => x.code === code);
  return dc ? dc.name[locale] : code;
}

/** Enabled lounges (with price) offered at a specific airport. */
export function catalogAirportLounges(catalog: Catalog, airportCode: string | null | undefined): CatalogAirportLounge[] {
  if (!airportCode) return [];
  for (const c of catalog.cities) {
    const a = c.airports.find((x) => x.code === airportCode);
    if (a) return a.lounges;
  }
  return [];
}

/** Find the city that owns an airport code. */
export function catalogCityForAirport(catalog: Catalog, airportCode: string | null | undefined): CatalogCity | undefined {
  if (!airportCode) return undefined;
  return catalog.cities.find((c) => c.airports.some((a) => a.code === airportCode));
}

/** Vehicle categories disabled for a city (empty when the city isn't loaded). */
export function catalogDisabledVehicles(catalog: Catalog, code: string | null | undefined): string[] {
  return catalogCity(catalog, code)?.disabledVehicles ?? [];
}

/** Destination cities (non-origin, active in catalog). */
export function destinationCities(catalog: Catalog): CatalogCity[] {
  return catalog.cities.filter((c) => !c.isOrigin);
}
