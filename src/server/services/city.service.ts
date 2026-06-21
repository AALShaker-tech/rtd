import "server-only";
import { prisma } from "@/lib/prisma";
import { loungeOptionsForCity } from "@/lib/domain";
import type { Catalog } from "@/lib/catalog";

/**
 * Build the city catalog from the DB (active cities only). Lounge availability
 * comes from CityLoungePricing rows when present, otherwise the country default.
 */
export async function getCityCatalog(): Promise<Catalog> {
  const cities = await prisma.city.findMany({
    where: { active: true },
    orderBy: [{ isOrigin: "desc" }, { nameEn: "asc" }],
    include: {
      airports: { orderBy: { id: "asc" } }, // natural (seed) order → primary airport first
      loungePricing: true,
      servicePricing: true,
    },
  });

  return {
    cities: cities.map((c) => {
      const configuredLounges = c.loungePricing.filter((l) => l.enabled).map((l) => l.loungeType);
      const lounges = configuredLounges.length
        ? configuredLounges
        : loungeOptionsForCity(c.code).map((l) => l.value);
      const disabledSteps = c.servicePricing.filter((s) => !s.enabled).map((s) => s.stepType);
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
