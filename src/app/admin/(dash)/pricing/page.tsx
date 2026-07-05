import { prisma } from "@/lib/prisma";
import {
  DEFAULT_LOUNGE_PRICES,
  DEFAULT_SERVICE_PRICES,
  DEFAULT_SERVICE_CLASS_PRICES,
  isCarStep,
  type StepType,
} from "@/lib/domain";
import { PricingManager } from "./PricingManager";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [services, lounges, vehicles, classPrices] = await Promise.all([
    prisma.servicePricing.findMany(),
    prisma.loungePricing.findMany(),
    prisma.vehicleCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.serviceClassPrice.findMany(),
  ]);

  // Merge DB rows with defaults so unseeded values still render.
  const serviceMap = new Map(services.map((s) => [s.stepType, s]));
  const loungeMap = new Map(lounges.map((l) => [l.loungeType, l]));
  const classPriceMap = new Map(classPrices.map((p) => [`${p.stepType}:${p.category}`, p.price]));
  const classCodes = vehicles.map((v) => v.category);

  return (
    <PricingManager
      services={Object.keys(DEFAULT_SERVICE_PRICES).map((stepType) => {
        const row = serviceMap.get(stepType as StepType);
        const car = isCarStep(stepType as StepType);
        return {
          stepType,
          isCar: car,
          basePrice: row?.basePrice ?? DEFAULT_SERVICE_PRICES[stepType as StepType],
          active: row?.active ?? true,
          // Per-class prices for car services (DB row → default).
          classPrices: car
            ? classCodes.map((cat) => ({
                category: cat,
                price:
                  classPriceMap.get(`${stepType}:${cat}`) ??
                  DEFAULT_SERVICE_CLASS_PRICES[stepType]?.[cat] ??
                  DEFAULT_SERVICE_PRICES[stepType as StepType],
              }))
            : [],
        };
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
        isRecommended: v.isRecommended,
        sortOrder: v.sortOrder,
        active: v.active,
      }))}
    />
  );
}
