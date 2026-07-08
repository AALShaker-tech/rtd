/**
 * Price-driven availability — the single rule deciding whether a journey step
 * (or one of its options) is actually offered to the customer.
 *
 * Product rule: a step or feature with no effective price (0 or unset) is never
 * shown. Prices live on the city, so "offered" always depends on the city a step
 * maps to (Riyadh-side steps → RUH, destination-side steps → the destination).
 * This is shared by the client builder/review and the server submit guard so the
 * three can never disagree about what's bookable.
 */

import type { PricingConfig } from "@/lib/pricing";
import type { StepDef } from "@/lib/domain";

/** Vehicle classes that carry a real (> 0) price for a car/chauffeur step in a city. */
export function pricedVehicleClasses(
  config: PricingConfig,
  city: string | null | undefined,
  stepType: string,
): string[] {
  const byClass = (city ? config.cityServiceClassPrices?.[city]?.[stepType] : undefined) ?? {};
  return Object.entries(byClass)
    .filter(([, price]) => (price ?? 0) > 0)
    .map(([category]) => category);
}

/**
 * Whether a step is actually offered for a city — i.e. it has a real price.
 *  - car / chauffeur: at least one vehicle class is priced.
 *  - assistance: at least one enabled lounge with a price is available. A lounge
 *    choice is required to add an assistance step, so a base price alone can't be
 *    booked — without a priced lounge the step would be an un-addable dead card.
 *  - anything else (purely structural): always shown.
 */
export function isStepOffered(
  def: StepDef,
  city: string | null | undefined,
  config: PricingConfig,
  availableLoungePrices: number[],
): boolean {
  if (def.features.transfer || def.features.chauffeur) {
    return pricedVehicleClasses(config, city, def.type).length > 0;
  }
  if (def.features.assistance) {
    return availableLoungePrices.some((price) => price > 0);
  }
  return true;
}
