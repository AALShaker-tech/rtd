import "server-only";
import { prisma } from "@/lib/prisma";
import { FALLBACK_STEPS, type CatalogStep } from "@/lib/steps";

function toCatalog(s: {
  code: string;
  nameEn: string;
  nameAr: string;
  shortNameEn: string;
  shortNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder: number;
  cityScope: string;
  featTransfer: boolean;
  featAssistance: boolean;
  featFlight: boolean;
  featHotel: boolean;
  featHome: boolean;
  featChauffeur: boolean;
  createsDriverTask: boolean;
  active: boolean;
}): CatalogStep {
  return {
    code: s.code,
    nameEn: s.nameEn,
    nameAr: s.nameAr,
    shortNameEn: s.shortNameEn,
    shortNameAr: s.shortNameAr,
    descriptionEn: s.descriptionEn,
    descriptionAr: s.descriptionAr,
    sortOrder: s.sortOrder,
    cityScope: (s.cityScope as CatalogStep["cityScope"]) ?? "DESTINATION",
    features: {
      transfer: s.featTransfer,
      assistance: s.featAssistance,
      flight: s.featFlight,
      hotel: s.featHotel,
      home: s.featHome,
      chauffeur: s.featChauffeur,
    },
    createsDriverTask: s.createsDriverTask,
    active: s.active,
  };
}

/** Active services (steps) for the customer flow, in order. Fallback to built-ins. */
export async function getStepCatalog(): Promise<CatalogStep[]> {
  const rows = await prisma.serviceStep.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  if (!rows.length) return FALLBACK_STEPS;
  return rows.map(toCatalog);
}

/** All services (incl. inactive) as a code→step map, for server-side resolution. */
export async function getStepMap(): Promise<Record<string, CatalogStep>> {
  const rows = await prisma.serviceStep.findMany();
  const list = rows.length ? rows.map(toCatalog) : FALLBACK_STEPS;
  return Object.fromEntries(list.map((s) => [s.code, s]));
}

/** All services (incl. inactive) for the admin editor. */
export async function listStepsAdmin() {
  return prisma.serviceStep.findMany({ orderBy: { sortOrder: "asc" } });
}
