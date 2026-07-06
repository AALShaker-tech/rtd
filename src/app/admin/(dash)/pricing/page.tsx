import { prisma } from "@/lib/prisma";
import { VehiclesManager } from "./VehiclesManager";

export const dynamic = "force-dynamic";

/**
 * Vehicle-class catalog. Prices live per city (managed on the Cities page); this
 * page only defines the vehicle classes themselves (names, capacity, models).
 */
export default async function VehicleClassPage() {
  const vehicles = await prisma.vehicleCategory.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <VehiclesManager
      vehicles={vehicles.map((v) => ({
        category: v.category,
        nameEn: v.nameEn,
        nameAr: v.nameAr,
        maxPassengers: v.maxPassengers,
        exampleModels: v.exampleModels,
        descriptionEn: v.descriptionEn,
        descriptionAr: v.descriptionAr,
        isRecommended: v.isRecommended,
        sortOrder: v.sortOrder,
        active: v.active,
      }))}
    />
  );
}
