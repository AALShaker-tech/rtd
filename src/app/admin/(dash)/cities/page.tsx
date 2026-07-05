import { serialize } from "@/lib/utils";
import { listCitiesAdmin } from "@/server/services/city.service";
import { getVehicleCatalog } from "@/server/services/vehicle.service";
import { getStepCatalog } from "@/server/services/step.service";
import { CitiesManager } from "./CitiesManager";

export const dynamic = "force-dynamic";

export default async function CitiesPage() {
  const [cities, vehicles, steps] = await Promise.all([listCitiesAdmin(), getVehicleCatalog(), getStepCatalog()]);
  return (
    <CitiesManager
      cities={serialize(cities)}
      vehicles={vehicles.map((v) => ({ category: v.category, nameEn: v.nameEn }))}
      steps={steps.map((s) => ({
        code: s.code,
        nameEn: s.nameEn,
        nameAr: s.nameAr,
        isCar: s.features.transfer || s.features.chauffeur,
      }))}
    />
  );
}
