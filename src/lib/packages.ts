/**
 * Package catalog — the admin-managed service packages shown to the customer.
 * The DB (ServicePackage) is the source of truth; the static PACKAGES constant
 * is a typed fallback so the page still works before the catalog loads.
 */

import { PACKAGES, type Locale } from "@/lib/domain";

export interface CatalogPackage {
  type: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  steps: string[];
  featured: boolean;
  sortOrder: number;
}

export const FALLBACK_PACKAGES: CatalogPackage[] = PACKAGES.map((p) => ({
  type: p.type,
  nameEn: p.name.en,
  nameAr: p.name.ar,
  descriptionEn: p.description.en,
  descriptionAr: p.description.ar,
  steps: p.steps,
  featured: !!p.featured,
  sortOrder: p.sortOrder,
}));

export function packageName(p: CatalogPackage, locale: Locale): string {
  return locale === "ar" ? p.nameAr : p.nameEn;
}

export function packageDescription(p: CatalogPackage, locale: Locale): string {
  return locale === "ar" ? p.descriptionAr : p.descriptionEn;
}
