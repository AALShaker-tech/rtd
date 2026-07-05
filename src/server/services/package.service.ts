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
  return rows.map(toCatalog);
}

/** A single active package by id (for booking). */
export async function getBookablePackage(id: string) {
  const row = await prisma.servicePackage.findUnique({ where: { id } });
  if (!row || !row.active) return null;
  return toCatalog(row);
}

/** All packages (incl. inactive) for the admin editor. */
export async function listPackagesAdmin() {
  return prisma.servicePackage.findMany({ orderBy: { sortOrder: "asc" } });
}

function toCatalog(p: {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  featured: boolean;
  sortOrder: number;
}): CatalogPackage {
  return {
    id: p.id,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    descriptionEn: p.descriptionEn,
    descriptionAr: p.descriptionAr,
    price: p.price,
    featured: p.featured,
    sortOrder: p.sortOrder,
  };
}
