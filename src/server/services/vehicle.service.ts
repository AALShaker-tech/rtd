import "server-only";
import { prisma } from "@/lib/prisma";
import { FALLBACK_VEHICLES, type CatalogVehicle } from "@/lib/vehicles";

/**
 * Build the vehicle catalog from the DB (active categories only, in sort order).
 * Falls back to the built-in fleet if nothing is configured yet.
 */
export async function getVehicleCatalog(): Promise<CatalogVehicle[]> {
  const rows = await prisma.vehicleCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!rows.length) return FALLBACK_VEHICLES;
  return rows.map((v) => ({
    category: v.category,
    nameEn: v.nameEn,
    nameAr: v.nameAr,
    maxPassengers: v.maxPassengers,
    exampleModels: v.exampleModels,
    descriptionEn: v.descriptionEn,
    descriptionAr: v.descriptionAr,
    isRecommended: v.isRecommended,
    multiplier: v.priceMultiplier,
    sortOrder: v.sortOrder,
  }));
}

/** Full fleet (incl. inactive) for the admin editor. */
export async function listVehiclesAdmin() {
  return prisma.vehicleCategory.findMany({ orderBy: { sortOrder: "asc" } });
}
