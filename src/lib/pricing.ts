/**
 * RTD pricing engine — pure, deterministic, shared by client (instant estimate)
 * and server (authoritative recompute). The server is the source of truth and
 * always recomputes before persisting; the client estimate is never trusted.
 *
 * Prices are direct amounts entered by the admin — no multipliers, no
 * destination factor. The journey total is the accumulative sum of steps.
 *   - Car transfer:  the per-(service × class) price for the chosen vehicle class
 *   - Chauffeur:     that per-class price × days × daily-usage tier (kept for now)
 *   - Lounge/assist: the lounge price (if chosen) else the service's base price
 *   - Skipped:       0
 * Every price lives on the city (one price per city). Each priced step has a
 * city (Riyadh steps → RUH, destination steps → the destination), and the price
 * is that city's amount for the service/class. Unset → 0.
 */

import {
  DEFAULT_LOUNGE_PRICES,
  DEFAULT_SERVICE_PRICES,
  DEFAULT_SERVICE_CLASS_PRICES,
  chauffeurUsageMultiplier,
  getStep,
  serviceHasCar,
  type StepType,
} from "@/lib/domain";
import type { JourneyStepInput } from "@/lib/types";

export interface PricingConfig {
  services: Record<string, number>; // stepType → base price (assistance / no-car)
  lounges: Record<string, number>; // loungeType → price
  serviceClassPrices: Record<string, Record<string, number>>; // stepType → class → price (car)
  // Per-city overrides (admin-managed). Take precedence over the global values.
  cityServicePrices?: Record<string, Record<string, number>>; // cityCode → stepType → price
  cityLoungePrices?: Record<string, Record<string, number>>; // cityCode → loungeType → price (legacy, unused)
  cityServiceClassPrices?: Record<string, Record<string, Record<string, number>>>; // city → stepType → class → price
  // Lounges are priced per airport: airportCode → loungeId → price.
  airportLoungePrices?: Record<string, Record<string, number>>;
}

/** Built-in defaults — used as a fallback when the DB hasn't been seeded. */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  services: { ...DEFAULT_SERVICE_PRICES },
  lounges: { ...DEFAULT_LOUNGE_PRICES },
  serviceClassPrices: structuredClone(DEFAULT_SERVICE_CLASS_PRICES),
  cityServicePrices: {},
  cityLoungePrices: {},
  cityServiceClassPrices: {},
  airportLoungePrices: {},
};

export interface StepPriceBreakdown {
  /** The unit price for the step (per-day for chauffeur). */
  basePrice: number;
  /** Final computed price for the step, rounded to whole SAR. */
  computedPrice: number;
}

/**
 * The per-class price for a car step: the city's amount for this
 * (service × class). Unset → 0 (one price per city; no global fallback).
 */
function carClassPrice(
  config: PricingConfig,
  cityCode: string | null | undefined,
  stepType: string,
  category: string | null | undefined,
): number {
  const cat = category ?? "VIP";
  return (cityCode ? config.cityServiceClassPrices?.[cityCode]?.[stepType]?.[cat] : undefined) ?? 0;
}

/** Compute the price breakdown for a single journey step. */
export function computeStepPrice(
  step: Pick<
    JourneyStepInput,
    "stepType" | "def" | "serviceType" | "skipped" | "city" | "airport" | "loungeType" | "carCategory" | "additionalVehicles" | "days" | "dailyUsage"
  >,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): StepPriceBreakdown {
  if (step.skipped || step.serviceType === "SKIP") return { basePrice: 0, computedPrice: 0 };

  // Behavior comes from the step's resolved def (data-driven), falling back to
  // the built-in def for known codes.
  const f = (step.def ?? getStep(step.stepType))?.features;

  // Chauffeur — per-day per-class price × days × daily-usage tier.
  if (f?.chauffeur) {
    const unit = carClassPrice(config, step.city, step.stepType, step.carCategory);
    const days = Math.max(1, step.days ?? 1);
    const usage = chauffeurUsageMultiplier(step.dailyUsage);
    return { basePrice: unit, computedPrice: Math.round(unit * days * usage) };
  }

  // Car transfer — the direct per-class price, plus any additional vehicles the
  // customer added to fit a larger party (each priced at its own class rate).
  if (f?.transfer && serviceHasCar(step.serviceType)) {
    const primary = carClassPrice(config, step.city, step.stepType, step.carCategory);
    const extra = (step.additionalVehicles ?? []).reduce(
      (sum, v) => sum + carClassPrice(config, step.city, step.stepType, v.carCategory),
      0,
    );
    return { basePrice: primary, computedPrice: Math.round(primary + extra) };
  }

  // Lounge / assistance — the lounge's per-airport price when a lounge is
  // selected, otherwise the city's base price for the service. Unset → 0.
  const loungePrice = step.loungeType && step.airport
    ? config.airportLoungePrices?.[step.airport]?.[step.loungeType]
    : undefined;
  const base = step.city ? config.cityServicePrices?.[step.city]?.[step.stepType] : undefined;
  const price = loungePrice ?? base ?? 0;
  return { basePrice: price, computedPrice: Math.round(price) };
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
