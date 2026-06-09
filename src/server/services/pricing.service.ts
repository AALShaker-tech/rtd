import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from "@/lib/pricing";

/**
 * Build the authoritative pricing config from the database, falling back to the
 * built-in defaults for any value not yet configured. This is what the server
 * uses to recompute prices before persisting (the client estimate is advisory).
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  const [services, lounges, vehicles, destinations] = await Promise.all([
    prisma.servicePricing.findMany({ where: { active: true } }),
    prisma.loungePricing.findMany({ where: { active: true } }),
    prisma.vehicleCategory.findMany(),
    prisma.destinationPricing.findMany({ where: { active: true } }),
  ]);

  const config: PricingConfig = {
    services: { ...DEFAULT_PRICING_CONFIG.services },
    lounges: { ...DEFAULT_PRICING_CONFIG.lounges },
    multipliers: { ...DEFAULT_PRICING_CONFIG.multipliers },
    destinationFactors: { ...DEFAULT_PRICING_CONFIG.destinationFactors },
    destinationSurcharges: {},
  };

  for (const s of services) config.services[s.stepType] = s.basePrice;
  for (const l of lounges) config.lounges[l.loungeType] = l.price;
  for (const v of vehicles) config.multipliers[v.category] = v.priceMultiplier;
  for (const d of destinations) {
    config.destinationFactors[d.cityCode] = d.factor;
    config.destinationSurcharges![d.cityCode] = d.surcharge;
  }

  return config;
}
