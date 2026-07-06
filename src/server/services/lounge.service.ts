import "server-only";
import { prisma } from "@/lib/prisma";

export interface LoungeCatalogItem {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder: number;
  active: boolean;
}

/** Active lounges (for the city-page airport editor and admin pickers), ordered. */
export async function getActiveLounges(): Promise<LoungeCatalogItem[]> {
  return prisma.lounge.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

/** All lounges (incl. inactive) for the admin Lounges editor. */
export async function listLoungesAdmin(): Promise<LoungeCatalogItem[]> {
  return prisma.lounge.findMany({ orderBy: { sortOrder: "asc" } });
}
