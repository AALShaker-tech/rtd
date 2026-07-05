import { getPackageCatalog } from "@/server/services/package.service";
import { PackagesView } from "./PackagesView";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const packages = await getPackageCatalog();
  return <PackagesView packages={packages} />;
}
