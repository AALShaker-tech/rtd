"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  FALLBACK_CATALOG,
  catalogCityName,
  catalogLoungeOptions,
  destinationCities,
  type Catalog,
  type CatalogCity,
} from "@/lib/catalog";
import { fetchCityCatalog } from "@/server/actions/city.actions";
import type { Locale } from "@/lib/domain";

interface CatalogCtx {
  catalog: Catalog;
  loaded: boolean;
  cities: CatalogCity[];
  destinations: CatalogCity[];
  cityName: (code: string | null | undefined, locale: Locale) => string;
  city: (code: string | null | undefined) => CatalogCity | undefined;
  loungeOptions: (code: string | null | undefined) => { value: string; name: { en: string; ar: string } }[];
}

const Ctx = createContext<CatalogCtx | null>(null);

export function CatalogProvider({
  children,
  initialCatalog,
}: {
  children: React.ReactNode;
  /** Live catalog resolved on the server (preferred). When present the client
   * skips the fetch, so a failed request can never mask admin changes (disabled
   * services, city edits) with the built-in fallback catalog. */
  initialCatalog?: Catalog;
}) {
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog ?? FALLBACK_CATALOG);
  const [loaded, setLoaded] = useState(!!initialCatalog?.cities?.length);

  useEffect(() => {
    if (initialCatalog?.cities?.length) return; // already hydrated with live server data
    let active = true;
    fetchCityCatalog()
      .then((c) => {
        if (active && c?.cities?.length) {
          setCatalog(c);
          setLoaded(true);
        } else if (active) setLoaded(true);
      })
      .catch(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [initialCatalog]);

  const value: CatalogCtx = {
    catalog,
    loaded,
    cities: catalog.cities,
    destinations: destinationCities(catalog),
    cityName: (code, locale) => catalogCityName(catalog, code, locale),
    city: (code) => catalog.cities.find((c) => c.code === code),
    loungeOptions: (code) => catalogLoungeOptions(catalog, code),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog(): CatalogCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
