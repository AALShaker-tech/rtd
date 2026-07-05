import { serialize } from "@/lib/utils";
import { listCitiesAdmin } from "@/server/services/city.service";
import { getVehicleCatalog } from "@/server/services/vehicle.service";
import { CitiesManager } from "./CitiesManager";

export const dynamic = "force-dynamic";

export default async function CitiesPage() {
  const [cities, vehicles] = await Promise.all([listCitiesAdmin(), getVehicleCatalog()]);
  return (
    <CitiesManager
      cities={serialize(cities)}
      vehicles={vehicles.map((v) => ({ category: v.category, nameEn: v.nameEn, multiplier: v.multiplier }))}
    />
  );
}
