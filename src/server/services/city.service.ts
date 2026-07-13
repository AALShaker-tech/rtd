import "server-only";
import { prisma } from "@/lib/prisma";
import type { Catalog } from "@/lib/catalog";

/**
 * Build the city catalog from the DB (active cities only). Lounges are attached
 * to airports: each airport exposes the lounges enabled for it (with price).
 */
export async function getCityCatalog(): Promise<Catalog> {
  const [cities, globalServices] = await Promise.all([
    prisma.city.findMany({
      where: { active: true },
      orderBy: [{ isOrigin: "desc" }, { nameEn: "asc" }],
      include: {
        // natural (seed) order → primary airport first; include each airport's
        // enabled lounges joined to the active catalog entry for name/description.
        airports: {
          where: { active: true },
          orderBy: { id: "asc" },
          include: { lounges: { where: { enabled: true }, include: { lounge: true } } },
        },
        servicePricing: true,
        vehiclePricing: true,
      },
    }),
    // A service turned off globally (Pricing page → "Enabled" unchecked) is
    // unavailable everywhere, not just where a per-city rule disables it.
    prisma.servicePricing.findMany({ where: { active: false } }),
  ]);

  const globallyDisabled = globalServices.map((s) => s.stepType);

  return {
    cities: cities.map((c) => {
      const disabledSteps = [
        ...new Set([
          ...c.servicePricing.filter((s) => !s.enabled).map((s) => s.stepType),
          ...globallyDisabled,
        ]),
      ];
      const disabledVehicles = c.vehiclePricing.filter((v) => !v.enabled).map((v) => v.category);
      const vehicleExampleModels: Record<string, string> = {};
      for (const v of c.vehiclePricing) {
        if (v.exampleModels && v.exampleModels.trim() !== "") vehicleExampleModels[v.category] = v.exampleModels;
      }
      return {
        code: c.code,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        country: c.country,
        isOrigin: c.isOrigin,
        landmarkKey: c.landmarkKey,
        airports: c.airports.map((a) => ({
          code: a.code,
          nameEn: a.nameEn,
          nameAr: a.nameAr,
          terminals: a.terminals,
          // Only lounges whose catalog entry is still active are offered.
          lounges: a.lounges
            .filter((al) => al.lounge.active)
            .map((al) => ({
              id: al.loungeId,
              nameEn: al.lounge.nameEn,
              nameAr: al.lounge.nameAr,
              descriptionEn: al.lounge.descriptionEn,
              descriptionAr: al.lounge.descriptionAr,
              price: al.price,
              priceMode: al.priceMode,
              groupCapacity: al.groupCapacity,
            })),
        })),
        disabledSteps,
        disabledVehicles,
        vehicleExampleModels,
      };
    }),
  };
}

/** Full city record for the admin editor. */
export async function getCityAdmin(code: string) {
  return prisma.city.findUnique({
    where: { code },
    include: {
      airports: true,
      servicePricing: true,
      loungePricing: true,
      vehiclePricing: true,
      serviceClassPricing: true,
    },
  });
}

export async function listCitiesAdmin() {
  return prisma.city.findMany({
    orderBy: [{ isOrigin: "desc" }, { nameEn: "asc" }],
    include: {
      airports: { orderBy: { code: "asc" }, include: { lounges: true } },
      servicePricing: true,
      loungePricing: true,
      vehiclePricing: true,
      serviceClassPricing: true,
    },
  });
}
