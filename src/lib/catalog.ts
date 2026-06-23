/**
 * City catalog — the admin-managed list of cities used by the customer flow.
 * The DB is the source of truth; the domain constants provide a fallback so the
 * UI still works before the catalog loads (or if the DB isn't seeded yet).
 */

import {
  CITIES,
  LOUNGE_TYPES,
  loungeOptionsForCity,
  type Locale,
} from "@/lib/domain";

export interface CatalogAirport {
  code: string;
  nameEn: string;
  nameAr: string;
  terminals: string[];
}

export interface CatalogCity {
  code: string;
  nameEn: string;
  nameAr: string;
  country: string;
  isOrigin: boolean;
  multiplier: number;
  airports: CatalogAirport[];
  /** Enabled lounge/airport-service option values for this city. */
  lounges: string[];
  /** Journey step types disabled for this city. */
  disabledSteps: string[];
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
    multiplier: 1,
    airports: c.airports.map((a) => ({ code: a.code, nameEn: a.name.en, nameAr: a.name.ar, terminals: a.terminals })),
    lounges: loungeOptionsForCity(c.code).map((l) => l.value),
    disabledSteps: [],
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

/** Lounge option {value,name} list for a city, using catalog availability. */
export function catalogLoungeOptions(catalog: Catalog, code: string | null | undefined) {
  const c = catalogCity(catalog, code);
  const values = c?.lounges?.length ? c.lounges : loungeOptionsForCity(code).map((l) => l.value);
  return LOUNGE_TYPES.filter((l) => values.includes(l.value));
}

/** Destination cities (non-origin, active in catalog). */
export function destinationCities(catalog: Catalog): CatalogCity[] {
  return catalog.cities.filter((c) => !c.isOrigin);
}
