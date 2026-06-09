/**
 * RTD pricing engine — pure, deterministic, shared by client (instant estimate)
 * and server (authoritative recompute). The server is the source of truth and
 * always recomputes before persisting; the client estimate is never trusted.
 *
 * Formulas
 *  - Car transfer:   base × vehicleMultiplier × destinationFactor
 *  - Chauffeur:      base × vehicleMultiplier × days × destinationFactor
 *  - Lounge/assist:  loungePrice (if a lounge is chosen) else base, × destinationFactor
 *  - Skipped:        0
 */

import {
  DEFAULT_DESTINATION_FACTORS,
  DEFAULT_LOUNGE_PRICES,
  DEFAULT_SERVICE_PRICES,
  VEHICLES,
  getStep,
  serviceHasCar,
  type CarCategory,
  type StepType,
} from "@/lib/domain";
import type { JourneyStepInput } from "@/lib/types";

export interface PricingConfig {
  services: Record<string, number>; // StepType → base price
  lounges: Record<string, number>; // loungeType → price
  multipliers: Record<string, number>; // CarCategory → multiplier
  destinationFactors: Record<string, number>; // cityCode → factor
  destinationSurcharges?: Record<string, number>; // cityCode → flat surcharge
}

/** Built-in defaults — used as a fallback when the DB hasn't been seeded. */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  services: { ...DEFAULT_SERVICE_PRICES },
  lounges: { ...DEFAULT_LOUNGE_PRICES },
  multipliers: Object.fromEntries(VEHICLES.map((v) => [v.category, v.multiplier])),
  destinationFactors: { ...DEFAULT_DESTINATION_FACTORS },
  destinationSurcharges: {},
};

export interface StepPriceBreakdown {
  basePrice: number;
  vehicleMultiplier: number;
  destinationFactor: number;
  /** Final computed price for the step, rounded to whole SAR. */
  computedPrice: number;
}

function destinationFactor(config: PricingConfig, cityCode?: string | null): number {
  if (!cityCode) return 1;
  return config.destinationFactors[cityCode] ?? 1;
}

/** Compute the price breakdown for a single journey step. */
export function computeStepPrice(
  step: Pick<
    JourneyStepInput,
    "stepType" | "serviceType" | "skipped" | "city" | "loungeType" | "carCategory" | "days"
  >,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): StepPriceBreakdown {
  const zero: StepPriceBreakdown = { basePrice: 0, vehicleMultiplier: 1, destinationFactor: 1, computedPrice: 0 };
  if (step.skipped || step.serviceType === "SKIP") return zero;

  const def = getStep(step.stepType);
  const factor = destinationFactor(config, step.city);
  const base = config.services[step.stepType] ?? 0;

  // Chauffeur — per-day pricing.
  if (def.features.chauffeur) {
    const mult = config.multipliers[step.carCategory ?? "VIP"] ?? 1;
    const days = Math.max(1, step.days ?? 1);
    return {
      basePrice: base,
      vehicleMultiplier: mult,
      destinationFactor: factor,
      computedPrice: Math.round(base * mult * days * factor),
    };
  }

  // Car transfer.
  if (def.features.transfer && serviceHasCar(step.serviceType)) {
    const mult = config.multipliers[step.carCategory ?? "VIP"] ?? 1;
    return {
      basePrice: base,
      vehicleMultiplier: mult,
      destinationFactor: factor,
      computedPrice: Math.round(base * mult * factor),
    };
  }

  // Lounge / assistance — lounge price overrides base when one is selected.
  const loungePrice = step.loungeType ? config.lounges[step.loungeType] : undefined;
  const effectiveBase = loungePrice ?? base;
  return {
    basePrice: effectiveBase,
    vehicleMultiplier: 1,
    destinationFactor: factor,
    computedPrice: Math.round(effectiveBase * factor),
  };
}

export interface JourneyPricing {
  perStep: { stepType: StepType; breakdown: StepPriceBreakdown }[];
  estimatedTotal: number;
}

/** Compute the full journey pricing (per-step + estimated total). */
export function computeJourneyPricing(
  steps: JourneyStepInput[],
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): JourneyPricing {
  const perStep = steps.map((s) => ({ stepType: s.stepType, breakdown: computeStepPrice(s, config) }));
  const estimatedTotal = perStep.reduce((sum, p) => sum + p.breakdown.computedPrice, 0);
  return { perStep, estimatedTotal };
}

/** Format a SAR amount for display. */
export function formatPrice(amount: number, locale: "en" | "ar"): string {
  if (locale === "ar") return `${amount.toLocaleString("ar-SA")} ﷼`;
  return `SAR ${amount.toLocaleString("en-US")}`;
}
