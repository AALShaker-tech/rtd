/**
 * Service (step) catalog — admin-managed journey services. The DB (ServiceStep)
 * is the source of truth; the static STEPS constant is a typed fallback and the
 * behavior source for the built-in codes.
 */

import { STEPS, DRIVER_TASK_STEPS, type StepDef, type StepFeatureSet, type Locale } from "@/lib/domain";

export interface CatalogStep {
  code: string;
  nameEn: string;
  nameAr: string;
  shortNameEn: string;
  shortNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder: number;
  cityScope: "RIYADH" | "DESTINATION" | "ANY";
  features: StepFeatureSet;
  createsDriverTask: boolean;
  active: boolean;
}

export const FALLBACK_STEPS: CatalogStep[] = STEPS.map((s) => ({
  code: s.type,
  nameEn: s.name.en,
  nameAr: s.name.ar,
  shortNameEn: s.shortName.en,
  shortNameAr: s.shortName.ar,
  descriptionEn: s.description.en,
  descriptionAr: s.description.ar,
  sortOrder: s.order,
  cityScope: s.cityScope,
  features: s.features,
  createsDriverTask: DRIVER_TASK_STEPS.has(s.type),
  active: true,
}));

/** Convert a catalog row to the StepDef shape the journey engine consumes. */
export function toStepDef(c: CatalogStep): StepDef {
  return {
    type: c.code,
    order: c.sortOrder,
    name: { en: c.nameEn, ar: c.nameAr },
    shortName: { en: c.shortNameEn, ar: c.shortNameAr },
    description: { en: c.descriptionEn, ar: c.descriptionAr },
    cityScope: c.cityScope,
    features: c.features,
  };
}

export function stepName(c: CatalogStep, locale: Locale): string {
  return locale === "ar" ? c.nameAr : c.nameEn;
}
export function stepShortName(c: CatalogStep, locale: Locale): string {
  return locale === "ar" ? c.shortNameAr : c.shortNameEn;
}
export function stepDescription(c: CatalogStep, locale: Locale): string {
  return locale === "ar" ? c.descriptionAr : c.descriptionEn;
}
