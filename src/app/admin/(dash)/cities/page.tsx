import { serialize } from "@/lib/utils";
import { listCitiesAdmin } from "@/server/services/city.service";
import { CitiesManager } from "./CitiesManager";

export const dynamic = "force-dynamic";

export default async function CitiesPage() {
  const cities = await listCitiesAdmin();
  return <CitiesManager cities={serialize(cities)} />;
}
