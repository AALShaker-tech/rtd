import "server-only";
import { prisma } from "@/lib/prisma";
import { type PricingConfig } from "@/lib/pricing";

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
  const [cityServices, cityClassPrices, airportLounges] = await Promise.all([
    prisma.cityServicePricing.findMany({ where: { enabled: true, price: { not: null } } }),
    prisma.cityServiceClassPrice.findMany(),
    prisma.airportLounge.findMany({ where: { enabled: true } }),
  ]);

  const config: PricingConfig = {
    services: {},
    lounges: {},
    serviceClassPrices: {},
    cityServicePrices: {},
    cityLoungePrices: {},
    cityServiceClassPrices: {},
    airportLoungePrices: {},
  };

  // Assistance/base price per city.
  for (const cs of cityServices) {
    (config.cityServicePrices![cs.cityCode] ??= {})[cs.stepType] = cs.price as number;
  }
  // Car per-class price per city.
  for (const cp of cityClassPrices) {
    ((config.cityServiceClassPrices![cp.cityCode] ??= {})[cp.stepType] ??= {})[cp.category] =
      cp.price;
  }
  // Lounge price per airport, with its charging mode (per-person / group).
  for (const al of airportLounges) {
    (config.airportLoungePrices![al.airportCode] ??= {})[al.loungeId] = {
      price: al.price,
      mode: al.priceMode,
      capacity: al.groupCapacity,
    };
  }

  return config;
}
