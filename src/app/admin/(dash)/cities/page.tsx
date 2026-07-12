import { serialize } from "@/lib/utils";
import { listCitiesAdmin } from "@/server/services/city.service";
import { getVehicleCatalog } from "@/server/services/vehicle.service";
import { getActiveLounges } from "@/server/services/lounge.service";
import { CitiesManager } from "./CitiesManager";

export const dynamic = "force-dynamic";

export default async function CitiesPage() {
  const [cities, vehicles, lounges] = await Promise.all([
    listCitiesAdmin(),
    getVehicleCatalog(),
    getActiveLounges(),
  ]);
  return (
    <CitiesManager
      cities={serialize(cities)}
      vehicles={vehicles.map((v) => ({ category: v.category, nameEn: v.nameEn }))}
      lounges={lounges.map((l) => ({ id: l.id, nameEn: l.nameEn, nameAr: l.nameAr, descriptionEn: l.descriptionEn, descriptionAr: l.descriptionAr }))}
    />
  );
}
