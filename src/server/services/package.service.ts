import "server-only";
import { prisma } from "@/lib/prisma";
import { FALLBACK_PACKAGES, type CatalogPackage } from "@/lib/packages";

/**
 * Active packages for the customer packages page, in sort order. Falls back to
 * the built-in packages when the DB isn't seeded.
 */
export async function getPackageCatalog(): Promise<CatalogPackage[]> {
  const rows = await prisma.servicePackage.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!rows.length) return FALLBACK_PACKAGES;
  return rows.map((p) => ({
    type: p.type,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    descriptionEn: p.descriptionEn,
    descriptionAr: p.descriptionAr,
    steps: p.includedSteps,
    featured: p.featured,
    sortOrder: p.sortOrder,
  }));
}

/** All packages (incl. inactive) for the admin editor. */
export async function listPackagesAdmin() {
  return prisma.servicePackage.findMany({ orderBy: { sortOrder: "asc" } });
}
