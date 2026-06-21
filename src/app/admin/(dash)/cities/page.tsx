import { listCitiesAdmin } from "@/server/services/city.service";
import { CitiesManager } from "./CitiesManager";

export const dynamic = "force-dynamic";

export default async function CitiesPage() {
  const cities = await listCitiesAdmin();
  return <CitiesManager cities={JSON.parse(JSON.stringify(cities))} />;
}
