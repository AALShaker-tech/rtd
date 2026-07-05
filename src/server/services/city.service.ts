import "server-only";
import { prisma } from "@/lib/prisma";
import { loungeOptionsForCity } from "@/lib/domain";
import type { Catalog } from "@/lib/catalog";

/**
 * Build the city catalog from the DB (active cities only). Lounge availability
 * comes from CityLoungePricing rows when present, otherwise the country default.
 */
export async function getCityCatalog(): Promise<Catalog> {
  const [cities, globalServices] = await Promise.all([
    prisma.city.findMany({
      where: { active: true },
      orderBy: [{ isOrigin: "desc" }, { nameEn: "asc" }],
      include: {
        airports: { orderBy: { id: "asc" } }, // natural (seed) order → primary airport first
        loungePricing: true,
        servicePricing: true,
      },
    }),
    // A service turned off globally (Pricing page → "Enabled" unchecked) is
    // unavailable everywhere, not just where a per-city rule disables it.
    prisma.servicePricing.findMany({ where: { active: false } }),
  ]);

  const globallyDisabled = globalServices.map((s) => s.stepType);

  return {
    cities: cities.map((c) => {
      // Available lounges = the city's default set (by country) plus any lounge
      // the admin explicitly enabled, minus any the admin explicitly disabled.
      // Treating the CityLoungePricing rows as overrides (not a replacement
      // allowlist) means a disable actually sticks — the previous fallback
      // resurrected the defaults whenever nothing was left explicitly enabled,
      // so disabling a default lounge (e.g. Marhaba) appeared to do nothing.
      const disabledLounges = new Set(
        c.loungePricing.filter((l) => !l.enabled).map((l) => l.loungeType),
      );
      const enabledLounges = c.loungePricing.filter((l) => l.enabled).map((l) => l.loungeType);
      const defaultLounges = loungeOptionsForCity(c.code).map((l) => l.value);
      const lounges = [...new Set([...defaultLounges, ...enabledLounges])].filter(
        (v) => !disabledLounges.has(v),
      );
      const disabledSteps = [
        ...new Set([
          ...c.servicePricing.filter((s) => !s.enabled).map((s) => s.stepType),
          ...globallyDisabled,
        ]),
      ];
      return {
        code: c.code,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        country: c.country,
        isOrigin: c.isOrigin,
        multiplier: c.multiplier,
        airports: c.airports.map((a) => ({ code: a.code, nameEn: a.nameEn, nameAr: a.nameAr, terminals: a.terminals })),
        lounges,
        disabledSteps,
      };
    }),
  };
}

/** Full city record for the admin editor. */
export async function getCityAdmin(code: string) {
  return prisma.city.findUnique({
    where: { code },
    include: { airports: true, servicePricing: true, loungePricing: true },
  });
}

export async function listCitiesAdmin() {
  return prisma.city.findMany({
    orderBy: [{ isOrigin: "desc" }, { nameEn: "asc" }],
    include: { airports: { orderBy: { code: "asc" } }, servicePricing: true, loungePricing: true },
  });
}
