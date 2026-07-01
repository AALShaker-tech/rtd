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
 * These tests pin the RTD pricing formulas against the seeded defaults
 * (DEFAULT_SERVICE_PRICES, VEHICLES, DEFAULT_DESTINATION_FACTORS, ...). The
 * pricing engine is the customer-facing estimate AND the server's authoritative
 * recompute, so a silent change to any multiplier must break a test here.
 *
 * Reference defaults used below:
 *   services: HOME_TO_RIYADH_AIRPORT 250, AIRPORT_TO_HOTEL 380,
 *             DEPARTURE_ASSIST_RIYADH 320, CHAUFFEUR_DURING_STAY 650
 *   vehicle multipliers: VVIP 2.0, VIP 1.4, ECONOMY 1.0
 *   destination factors: RUH 1.0, LON 1.3, PAR 1.25, DXB 1.1, CAI 0.9
 *   lounge prices: EXECUTIVE_OFFICE 320, MEET_ASSIST 180
 *   chauffeur usage: SEVEN_HOURS 1.0, EIGHT_HOURS 1.1, FULL_DAY 1.4
 */

function step(overrides: Partial<JourneyStepInput>): JourneyStepInput {
  return {
    stepType: "HOME_TO_RIYADH_AIRPORT",
    serviceType: "CAR_ONLY",
    skipped: false,
    ...overrides,
  };
}

describe("computeStepPrice — car transfers", () => {
  it("prices a car transfer as base × vehicleMultiplier (no destination → factor 1)", () => {
    const b = computeStepPrice(
      step({ stepType: "HOME_TO_RIYADH_AIRPORT", serviceType: "CAR_ONLY", carCategory: "VIP" }),
    );
    // 250 × 1.4 × 1 = 350
    expect(b.computedPrice).toBe(350);
    expect(b.basePrice).toBe(250);
    expect(b.vehicleMultiplier).toBe(1.4);
    expect(b.destinationFactor).toBe(1);
  });

  it("applies the destination factor for a destination transfer", () => {
    const b = computeStepPrice(
      step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VVIP", city: "LON" }),
    );
    // 380 × 2.0 × 1.3 = 988
    expect(b.computedPrice).toBe(988);
    expect(b.destinationFactor).toBe(1.3);
  });

  it("defaults to the VIP multiplier when no car category is given", () => {
    const b = computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "MEET_ASSIST_CAR" }));
    // 380 × 1.4 × 1 = 532
    expect(b.computedPrice).toBe(532);
  });
});

describe("computeStepPrice — chauffeur", () => {
  it("prices per day × usage multiplier × destination factor", () => {
    const b = computeStepPrice(
      step({
        stepType: "CHAUFFEUR_DURING_STAY",
        serviceType: "CAR_ONLY",
        carCategory: "VIP",
        city: "LON",
        days: 3,
        dailyUsage: "FULL_DAY",
      }),
    );
    // 650 × 1.4 × 3 × 1.4 × 1.3 = 4968.6 → 4969
    expect(b.computedPrice).toBe(4969);
  });

  it("treats missing days as 1 and missing usage as ×1", () => {
    const b = computeStepPrice(step({ stepType: "CHAUFFEUR_DURING_STAY", serviceType: "CAR_ONLY" }));
    // 650 × 1.4 (default VIP) × 1 × 1 × 1 = 910
    expect(b.computedPrice).toBe(910);
  });

  it("charges the 8-hour usage uplift", () => {
    const b = computeStepPrice(
      step({ stepType: "CHAUFFEUR_DURING_STAY", serviceType: "CAR_ONLY", carCategory: "ECONOMY", days: 2, dailyUsage: "EIGHT_HOURS" }),
    );
    // 650 × 1.0 × 2 × 1.1 × 1 = 1430
    expect(b.computedPrice).toBe(1430);
  });
});

describe("computeStepPrice — lounge / assistance", () => {
  it("uses the lounge price (× factor) when a lounge is selected", () => {
    const b = computeStepPrice(
      step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY", loungeType: "EXECUTIVE_OFFICE" }),
    );
    // EXECUTIVE_OFFICE 320 × 1 = 320
    expect(b.computedPrice).toBe(320);
  });

  it("falls back to the service base when no lounge is selected", () => {
    const b = computeStepPrice(step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY" }));
    expect(b.computedPrice).toBe(320); // base for DEPARTURE_ASSIST_RIYADH
  });
});

describe("computeStepPrice — skipped", () => {
  it("returns zero for a skipped step", () => {
    expect(computeStepPrice(step({ skipped: true })).computedPrice).toBe(0);
  });
  it("returns zero for a SKIP service type", () => {
    expect(computeStepPrice(step({ serviceType: "SKIP" })).computedPrice).toBe(0);
  });
});

describe("computeStepPrice — per-city overrides", () => {
  const config: PricingConfig = {
    ...DEFAULT_PRICING_CONFIG,
    cityServicePrices: { LON: { AIRPORT_TO_HOTEL: 500 } },
    cityLoungePrices: { LON: { MEET_ASSIST: 250 } },
  };

  it("a per-city service price overrides the global base but the factor still applies", () => {
    const b = computeStepPrice(
      step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP", city: "LON" }),
      config,
    );
    // 500 (city base) × 1.4 × 1.3 = 910
    expect(b.basePrice).toBe(500);
    expect(b.computedPrice).toBe(910);
  });

  it("a per-city lounge price overrides the global lounge price", () => {
    const b = computeStepPrice(
      step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", loungeType: "MEET_ASSIST", city: "LON" }),
      config,
    );
    // 250 (city lounge) × 1.3 = 325
    expect(b.computedPrice).toBe(325);
  });
});

describe("computeJourneyPricing", () => {
  it("sums the per-step computed prices into the estimated total", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "HOME_TO_RIYADH_AIRPORT", serviceType: "CAR_ONLY", carCategory: "VIP" }), // 350
      step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VVIP", city: "LON" }), // 988
    ];
    const result = computeJourneyPricing(steps);
    expect(result.perStep).toHaveLength(2);
    expect(result.estimatedTotal).toBe(350 + 988);
  });

  it("is zero for an all-skipped journey", () => {
    const steps: JourneyStepInput[] = [step({ skipped: true }), step({ serviceType: "SKIP" })];
    expect(computeJourneyPricing(steps).estimatedTotal).toBe(0);
  });
});

describe("formatPrice", () => {
  it("formats English amounts with a thousands separator", () => {
    expect(formatPrice(1000, "en")).toBe("SAR 1,000");
    expect(formatPrice(4969, "en")).toBe("SAR 4,969");
  });
  it("uses the riyal symbol for Arabic", () => {
    expect(formatPrice(1000, "ar")).toContain("﷼");
  });
});
