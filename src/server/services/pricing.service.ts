import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from "@/lib/pricing";

/**
 * Build the authoritative pricing config from the database, falling back to the
 * built-in defaults for any value not yet configured. This is what the server
 * uses to recompute prices before persisting (the client estimate is advisory).
 *
 * Prices are direct amounts — no multipliers. Car services are priced per
 * (stepType × class) via ServiceClassPrice, with per-city overrides via
 * CityServiceClassPrice. Assistance/lounge services use ServicePricing /
 * LoungePricing (+ their per-city overrides).
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  const [services, lounges, classPrices, cityServices, cityLounges, cityClassPrices] =
    await Promise.all([
      prisma.servicePricing.findMany({ where: { active: true } }),
      prisma.loungePricing.findMany({ where: { active: true } }),
      prisma.serviceClassPrice.findMany(),
      prisma.cityServicePricing.findMany({ where: { enabled: true, price: { not: null } } }),
      prisma.cityLoungePricing.findMany({ where: { enabled: true, price: { not: null } } }),
      prisma.cityServiceClassPrice.findMany(),
    ]);

  const config: PricingConfig = {
    services: { ...DEFAULT_PRICING_CONFIG.services },
    lounges: { ...DEFAULT_PRICING_CONFIG.lounges },
    serviceClassPrices: structuredClone(DEFAULT_PRICING_CONFIG.serviceClassPrices),
    cityServicePrices: {},
    cityLoungePrices: {},
    cityServiceClassPrices: {},
  };

  for (const s of services) config.services[s.stepType] = s.basePrice;
  for (const l of lounges) config.lounges[l.loungeType] = l.price;

  // Global per-class car prices.
  for (const p of classPrices) {
    (config.serviceClassPrices[p.stepType] ??= {})[p.category] = p.price;
  }

  // Per-city assistance/lounge overrides.
  for (const cs of cityServices) {
    (config.cityServicePrices![cs.cityCode] ??= {})[cs.stepType] = cs.price as number;
  }
  for (const cl of cityLounges) {
    (config.cityLoungePrices![cl.cityCode] ??= {})[cl.loungeType] = cl.price as number;
  }

  // Per-city per-class car overrides.
  for (const cp of cityClassPrices) {
    ((config.cityServiceClassPrices![cp.cityCode] ??= {})[cp.stepType] ??= {})[cp.category] =
      cp.price;
  }

  return config;
}
