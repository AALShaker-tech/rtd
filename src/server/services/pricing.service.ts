import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from "@/lib/pricing";

/**
 * Build the authoritative pricing config from the database, falling back to the
 * built-in defaults for any value not yet configured. This is what the server
 * uses to recompute prices before persisting (the client estimate is advisory).
 *
 * City multipliers and per-city service/lounge overrides come from the
 * admin-managed City / CityServicePricing / CityLoungePricing tables.
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  const [services, lounges, vehicles, cities, cityServices, cityLounges, cityVehicles] =
    await Promise.all([
      prisma.servicePricing.findMany({ where: { active: true } }),
      prisma.loungePricing.findMany({ where: { active: true } }),
      prisma.vehicleCategory.findMany(),
      prisma.city.findMany(),
      prisma.cityServicePricing.findMany({ where: { enabled: true, price: { not: null } } }),
      prisma.cityLoungePricing.findMany({ where: { enabled: true, price: { not: null } } }),
      prisma.cityVehiclePricing.findMany({ where: { enabled: true, multiplier: { not: null } } }),
    ]);

  const config: PricingConfig = {
    services: { ...DEFAULT_PRICING_CONFIG.services },
    lounges: { ...DEFAULT_PRICING_CONFIG.lounges },
    multipliers: { ...DEFAULT_PRICING_CONFIG.multipliers },
    destinationFactors: { ...DEFAULT_PRICING_CONFIG.destinationFactors },
    cityServicePrices: {},
    cityLoungePrices: {},
    cityVehicleMultipliers: {},
  };

  for (const s of services) config.services[s.stepType] = s.basePrice;
  for (const l of lounges) config.lounges[l.loungeType] = l.price;
  for (const v of vehicles) config.multipliers[v.category] = v.priceMultiplier;

  // City multiplier = destination factor.
  for (const c of cities) config.destinationFactors[c.code] = c.multiplier;

  // Per-city service / lounge price overrides.
  for (const cs of cityServices) {
    (config.cityServicePrices![cs.cityCode] ??= {})[cs.stepType] = cs.price as number;
  }
  for (const cl of cityLounges) {
    (config.cityLoungePrices![cl.cityCode] ??= {})[cl.loungeType] = cl.price as number;
  }

  // Per-city vehicle multiplier overrides.
  for (const cv of cityVehicles) {
    (config.cityVehicleMultipliers![cv.cityCode] ??= {})[cv.category] = cv.multiplier as number;
  }

  return config;
}
