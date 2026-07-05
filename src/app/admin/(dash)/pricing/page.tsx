import { prisma } from "@/lib/prisma";
import { DEFAULT_LOUNGE_PRICES, DEFAULT_SERVICE_PRICES } from "@/lib/domain";
import { PricingManager } from "./PricingManager";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [services, lounges, vehicles] = await Promise.all([
    prisma.servicePricing.findMany(),
    prisma.loungePricing.findMany(),
    prisma.vehicleCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  // Merge DB rows with defaults so unseeded values still render.
  const serviceMap = new Map(services.map((s) => [s.stepType, s]));
  const loungeMap = new Map(lounges.map((l) => [l.loungeType, l]));

  return (
    <PricingManager
      services={Object.keys(DEFAULT_SERVICE_PRICES).map((stepType) => {
        const row = serviceMap.get(stepType as any);
        return { stepType, basePrice: row?.basePrice ?? DEFAULT_SERVICE_PRICES[stepType as keyof typeof DEFAULT_SERVICE_PRICES], active: row?.active ?? true };
      })}
      lounges={Object.keys(DEFAULT_LOUNGE_PRICES).map((loungeType) => {
        const row = loungeMap.get(loungeType);
        return { loungeType, price: row?.price ?? DEFAULT_LOUNGE_PRICES[loungeType], active: row?.active ?? true };
      })}
      vehicles={vehicles.map((v) => ({
        category: v.category,
        nameEn: v.nameEn,
        nameAr: v.nameAr,
        maxPassengers: v.maxPassengers,
        exampleModels: v.exampleModels,
        descriptionEn: v.descriptionEn,
        descriptionAr: v.descriptionAr,
        multiplier: v.priceMultiplier,
        isRecommended: v.isRecommended,
        sortOrder: v.sortOrder,
        active: v.active,
      }))}
    />
  );
}
