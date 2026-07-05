import { prisma } from "@/lib/prisma";
import { DEFAULT_LOUNGE_PRICES } from "@/lib/domain";
import { getStepCatalog } from "@/server/services/step.service";
import { PricingManager } from "./PricingManager";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [steps, services, lounges, vehicles, classPrices] = await Promise.all([
    getStepCatalog(),
    prisma.servicePricing.findMany(),
    prisma.loungePricing.findMany(),
    prisma.vehicleCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.serviceClassPrice.findMany(),
  ]);

  const serviceMap = new Map(services.map((s) => [s.stepType, s]));
  const loungeMap = new Map(lounges.map((l) => [l.loungeType, l]));
  const classPriceMap = new Map(classPrices.map((p) => [`${p.stepType}:${p.category}`, p.price]));
  const classCodes = vehicles.map((v) => v.category);

  return (
    <PricingManager
      services={steps.map((step) => {
        const row = serviceMap.get(step.code);
        const car = step.features.transfer || step.features.chauffeur;
        return {
          stepType: step.code,
          name: { en: step.nameEn, ar: step.nameAr },
          isCar: car,
          basePrice: row?.basePrice ?? 0,
          active: row?.active ?? true,
          classPrices: car
            ? classCodes.map((cat) => ({
                category: cat,
                price: classPriceMap.get(`${step.code}:${cat}`) ?? row?.basePrice ?? 0,
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
