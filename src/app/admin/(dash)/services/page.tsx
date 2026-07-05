import { listStepsAdmin } from "@/server/services/step.service";
import { FALLBACK_STEPS } from "@/lib/steps";
import { ServicesManager, type ServiceRow } from "./ServicesManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const rows = await listStepsAdmin();

  // Before the first save the table is empty — show the built-in services so the
  // admin can see and edit them (the first save materialises the row).
  const services: ServiceRow[] = rows.length
    ? rows.map((r) => ({
        id: r.id,
        code: r.code,
        nameEn: r.nameEn,
        nameAr: r.nameAr,
        shortNameEn: r.shortNameEn,
        shortNameAr: r.shortNameAr,
        descriptionEn: r.descriptionEn,
        descriptionAr: r.descriptionAr,
        sortOrder: r.sortOrder,
        cityScope: r.cityScope as ServiceRow["cityScope"],
        featTransfer: r.featTransfer,
        featAssistance: r.featAssistance,
        featFlight: r.featFlight,
        featHotel: r.featHotel,
        featHome: r.featHome,
        featChauffeur: r.featChauffeur,
        createsDriverTask: r.createsDriverTask,
        active: r.active,
      }))
    : FALLBACK_STEPS.map((s) => ({
        id: "",
        code: s.code,
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        shortNameEn: s.shortNameEn,
        shortNameAr: s.shortNameAr,
        descriptionEn: s.descriptionEn,
        descriptionAr: s.descriptionAr,
        sortOrder: s.sortOrder,
        cityScope: s.cityScope,
        featTransfer: s.features.transfer,
        featAssistance: s.features.assistance,
        featFlight: s.features.flight,
        featHotel: s.features.hotel,
        featHome: s.features.home,
        featChauffeur: s.features.chauffeur,
        createsDriverTask: s.createsDriverTask,
        active: s.active,
      }));

  return <ServicesManager services={services} />;
}
