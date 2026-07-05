/**
 * Package catalog — admin-managed standalone products (name, description,
 * price). The DB (ServicePackage) is the source of truth; the static PACKAGES
 * constant is a typed fallback shown before the catalog is seeded.
 */

import { PACKAGES, type Locale } from "@/lib/domain";

export interface CatalogPackage {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  featured: boolean;
  sortOrder: number;
}

export const FALLBACK_PACKAGES: CatalogPackage[] = PACKAGES.map((p) => ({
  id: p.type,
  nameEn: p.name.en,
  nameAr: p.name.ar,
  descriptionEn: p.description.en,
  descriptionAr: p.description.ar,
  price: p.price,
  featured: !!p.featured,
  sortOrder: p.sortOrder,
}));

export function packageName(p: CatalogPackage, locale: Locale): string {
  return locale === "ar" ? p.nameAr : p.nameEn;
}

export function packageDescription(p: CatalogPackage, locale: Locale): string {
  return locale === "ar" ? p.descriptionAr : p.descriptionEn;
}
