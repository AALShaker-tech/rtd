import { describe, it, expect } from "vitest";
import {
  computeStepPrice,
  computeJourneyPricing,
  formatPrice,
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
} from "@/lib/pricing";
import type { JourneyStepInput } from "@/lib/types";

/**
 * Pricing model: direct admin-entered amounts, no multipliers, no destination
 * factor. Car services are priced per (service × class); the journey total is
 * the accumulative sum of steps.
 *
 * Default per-class car prices (seeded as old base × class factor):
 *   HOME_TO_RIYADH_AIRPORT 250 → VVIP 500, VIP 350, ECONOMY 250
 *   AIRPORT_TO_HOTEL       380 → VVIP 760, VIP 532, ECONOMY 380
 *   CHAUFFEUR_DURING_STAY  650 → VVIP 1300, VIP 910, ECONOMY 650
 * Assistance bases: DEPARTURE_ASSIST_RIYADH 320. Lounges: EXECUTIVE_OFFICE 320,
 * MEET_ASSIST 180. Chauffeur usage tiers: SEVEN_HOURS 1.0, EIGHT 1.1, FULL 1.4.
 */

function step(overrides: Partial<JourneyStepInput>): JourneyStepInput {
  return {
    stepType: "HOME_TO_RIYADH_AIRPORT",
    serviceType: "CAR_ONLY",
    skipped: false,
    ...overrides,
  };
}

describe("computeStepPrice — car transfers (per-class, no multiplier)", () => {
  it("prices a transfer at the class's direct price", () => {
    const b = computeStepPrice(step({ stepType: "HOME_TO_RIYADH_AIRPORT", serviceType: "CAR_ONLY", carCategory: "VIP" }));
    expect(b.computedPrice).toBe(350);
    expect(b.basePrice).toBe(350);
  });

  it("uses the VVIP price for a VVIP booking", () => {
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VVIP" })).computedPrice,
    ).toBe(760);
  });

  it("is unaffected by the destination city (no factor)", () => {
    const lon = computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP", city: "LON" }));
    const ruh = computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP", city: "RUH" }));
    expect(lon.computedPrice).toBe(532);
    expect(ruh.computedPrice).toBe(532);
  });

  it("defaults to the VIP price when no class is given", () => {
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "MEET_ASSIST_CAR" })).computedPrice,
    ).toBe(532);
  });

  it("honors a global per-class price override", () => {
    const config: PricingConfig = {
      ...DEFAULT_PRICING_CONFIG,
      serviceClassPrices: {
        ...DEFAULT_PRICING_CONFIG.serviceClassPrices,
        AIRPORT_TO_HOTEL: { VVIP: 900, VIP: 600, ECONOMY: 400 },
      },
    };
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP" }), config).computedPrice,
    ).toBe(600);
  });

  it("honors a per-city per-class override, else falls back to global", () => {
    const config: PricingConfig = {
      ...DEFAULT_PRICING_CONFIG,
      cityServiceClassPrices: { LON: { AIRPORT_TO_HOTEL: { VIP: 700 } } },
    };
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP", city: "LON" }), config).computedPrice,
    ).toBe(700);
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP", city: "PAR" }), config).computedPrice,
    ).toBe(532);
  });

  it("prices a brand-new custom class from its configured price", () => {
    const config: PricingConfig = {
      ...DEFAULT_PRICING_CONFIG,
      serviceClassPrices: {
        ...DEFAULT_PRICING_CONFIG.serviceClassPrices,
        AIRPORT_TO_HOTEL: { ...DEFAULT_PRICING_CONFIG.serviceClassPrices.AIRPORT_TO_HOTEL, LUXURY_SUV: 1200 },
      },
    };
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "LUXURY_SUV" }), config).computedPrice,
    ).toBe(1200);
  });
});

describe("computeStepPrice — chauffeur (per-class × days × usage tier)", () => {
  it("prices per-day × days × usage tier", () => {
    const b = computeStepPrice(
      step({ stepType: "CHAUFFEUR_DURING_STAY", serviceType: "CAR_ONLY", carCategory: "VIP", days: 3, dailyUsage: "FULL_DAY" }),
    );
    // 910 × 3 × 1.4 = 3822
    expect(b.computedPrice).toBe(3822);
  });

  it("treats missing days as 1 and missing usage as ×1", () => {
    expect(
      computeStepPrice(step({ stepType: "CHAUFFEUR_DURING_STAY", serviceType: "CAR_ONLY" })).computedPrice,
    ).toBe(910);
  });
});

describe("computeStepPrice — assistance / lounge (no class, no factor)", () => {
  it("uses the lounge price when a lounge is chosen", () => {
    expect(
      computeStepPrice(step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY", loungeType: "EXECUTIVE_OFFICE" })).computedPrice,
    ).toBe(320);
  });

  it("uses the service base when no lounge is chosen", () => {
    expect(
      computeStepPrice(step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY" })).computedPrice,
    ).toBe(320);
  });

  it("is unaffected by the destination city", () => {
    expect(
      computeStepPrice(step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", loungeType: "MEET_ASSIST", city: "LON" })).computedPrice,
    ).toBe(180);
  });
});

describe("computeStepPrice — skipped", () => {
  it("returns 0 for a skipped or SKIP step", () => {
    expect(computeStepPrice(step({ skipped: true })).computedPrice).toBe(0);
    expect(computeStepPrice(step({ serviceType: "SKIP" })).computedPrice).toBe(0);
  });
});

describe("computeJourneyPricing — accumulative sum", () => {
  it("sums the selected step prices", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "HOME_TO_RIYADH_AIRPORT", serviceType: "CAR_ONLY", carCategory: "VIP" }), // 350
      step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY", loungeType: "EXECUTIVE_OFFICE" }), // 320
      step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VVIP" }), // 760
    ];
    expect(computeJourneyPricing(steps).estimatedTotal).toBe(350 + 320 + 760);
  });

  it("excludes skipped steps from the total", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "HOME_TO_RIYADH_AIRPORT", serviceType: "CAR_ONLY", carCategory: "VIP" }),
      step({ stepType: "AIRPORT_TO_HOTEL", skipped: true }),
    ];
    expect(computeJourneyPricing(steps).estimatedTotal).toBe(350);
  });
});

describe("formatPrice", () => {
  it("formats a SAR amount", () => {
    expect(formatPrice(1000, "en")).toContain("1,000");
    expect(formatPrice(1000, "ar")).toContain("﷼");
  });
});
