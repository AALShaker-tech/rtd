import { serialize } from "@/lib/utils";
import { listPackagesAdmin } from "@/server/services/package.service";
import { PackagesManager } from "./PackagesManager";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await listPackagesAdmin();
  return <PackagesManager packages={serialize(packages)} />;
}
