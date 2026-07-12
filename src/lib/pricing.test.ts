import { describe, it, expect } from "vitest";
import {
  computeStepPrice,
  computeJourneyPricing,
  formatPrice,
  type PricingConfig,
} from "@/lib/pricing";
import type { JourneyStepInput } from "@/lib/types";

/**
 * Pricing model: one price per city. Every priced step has a city (Riyadh steps
 * → RUH, destination steps → the destination) and the price is that city's
 * amount for the service/class. Unset → 0. No global layer, no multipliers, no
 * destination factor; the journey total is the accumulative sum of steps.
 */

// A city-scoped price sheet for the tests. RUH carries the full set used by
// most cases; LON/PAR differ to prove prices are per-city.
const CFG: PricingConfig = {
  services: {},
  lounges: {},
  serviceClassPrices: {},
  cityServiceClassPrices: {
    RUH: {
      HOME_TO_RIYADH_AIRPORT: { VVIP: 500, VIP: 350, ECONOMY: 250 },
      AIRPORT_TO_HOTEL: { VVIP: 760, VIP: 532, ECONOMY: 380, LUXURY_SUV: 1200 },
      CHAUFFEUR_DURING_STAY: { VVIP: 1300, VIP: 910, ECONOMY: 650 },
    },
    LON: { AIRPORT_TO_HOTEL: { VIP: 700 } },
    PAR: { AIRPORT_TO_HOTEL: { VIP: 532 } },
  },
  cityServicePrices: {
    RUH: { DEPARTURE_ASSIST_RIYADH: 320 },
    LON: { ARRIVAL_ASSIST_DESTINATION: 420 },
  },
  // Lounges are priced per airport (airportCode → loungeId → price).
  airportLoungePrices: {
    RUHT: { EXECUTIVE_OFFICE: 320 },
    LHR: { MEET_ASSIST: 180 },
  },
};

function step(overrides: Partial<JourneyStepInput>): JourneyStepInput {
  return {
    stepType: "HOME_TO_RIYADH_AIRPORT",
    serviceType: "CAR_ONLY",
    skipped: false,
    city: "RUH",
    ...overrides,
  };
}

describe("computeStepPrice — car transfers (per-class, per-city)", () => {
  it("prices a transfer at the city's class price", () => {
    const b = computeStepPrice(step({ stepType: "HOME_TO_RIYADH_AIRPORT", serviceType: "CAR_ONLY", carCategory: "VIP" }), CFG);
    expect(b.computedPrice).toBe(350);
    expect(b.basePrice).toBe(350);
  });

  it("uses the VVIP price for a VVIP booking", () => {
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VVIP" }), CFG).computedPrice,
    ).toBe(760);
  });

  it("prices from the booking city — different cities, different prices", () => {
    const lon = computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP", city: "LON" }), CFG);
    const par = computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP", city: "PAR" }), CFG);
    expect(lon.computedPrice).toBe(700);
    expect(par.computedPrice).toBe(532);
  });

  it("defaults to the VIP price when no class is given", () => {
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "MEET_ASSIST_CAR" }), CFG).computedPrice,
    ).toBe(532);
  });

  it("is 0 when the city has no price set for the service", () => {
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VIP", city: "DXB" }), CFG).computedPrice,
    ).toBe(0);
  });

  it("prices a brand-new custom class from the city's configured price", () => {
    expect(
      computeStepPrice(step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "LUXURY_SUV" }), CFG).computedPrice,
    ).toBe(1200);
  });
});

describe("computeStepPrice — additional vehicles (multi-vehicle transfers)", () => {
  it("adds each extra vehicle's class price to the primary", () => {
    const b = computeStepPrice(
      step({
        stepType: "AIRPORT_TO_HOTEL",
        serviceType: "CAR_ONLY",
        carCategory: "VIP", // 532
        additionalVehicles: [{ carCategory: "VVIP" }, { carCategory: "ECONOMY" }], // 760 + 380
      }),
      CFG,
    );
    expect(b.computedPrice).toBe(532 + 760 + 380);
    // basePrice stays the primary unit price.
    expect(b.basePrice).toBe(532);
  });

  it("ignores additional vehicles for a skipped step", () => {
    expect(
      computeStepPrice(
        step({ stepType: "AIRPORT_TO_HOTEL", carCategory: "VIP", additionalVehicles: [{ carCategory: "VVIP" }], skipped: true }),
        CFG,
      ).computedPrice,
    ).toBe(0);
  });

  it("prices an extra vehicle of an unpriced class as 0", () => {
    expect(
      computeStepPrice(
        step({ stepType: "AIRPORT_TO_HOTEL", carCategory: "VIP", additionalVehicles: [{ carCategory: "NOT_PRICED" }] }),
        CFG,
      ).computedPrice,
    ).toBe(532);
  });
});

describe("computeStepPrice — chauffeur (per-class × days × usage tier)", () => {
  it("prices per-day × days × usage tier", () => {
    const b = computeStepPrice(
      step({ stepType: "CHAUFFEUR_DURING_STAY", serviceType: "CAR_ONLY", carCategory: "VIP", days: 3, dailyUsage: "FULL_DAY" }),
      CFG,
    );
    // Single full-day (10h) tier at ×1.0: 910 × 3 × 1.0 = 2730
    expect(b.computedPrice).toBe(2730);
  });

  it("treats missing days as 1 and missing usage as ×1", () => {
    expect(
      computeStepPrice(step({ stepType: "CHAUFFEUR_DURING_STAY", serviceType: "CAR_ONLY" }), CFG).computedPrice,
    ).toBe(910);
  });
});

describe("computeStepPrice — assistance / lounge (lounge per airport)", () => {
  it("uses the lounge's per-airport price when a lounge is chosen", () => {
    expect(
      computeStepPrice(step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY", airport: "RUHT", loungeType: "EXECUTIVE_OFFICE" }), CFG).computedPrice,
    ).toBe(320);
  });

  it("uses the city's service base when no lounge is chosen", () => {
    expect(
      computeStepPrice(step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY" }), CFG).computedPrice,
    ).toBe(320);
  });

  it("prices the lounge from the chosen airport", () => {
    expect(
      computeStepPrice(step({ stepType: "ARRIVAL_ASSIST_DESTINATION", serviceType: "MEET_ASSIST_ONLY", loungeType: "MEET_ASSIST", city: "LON", airport: "LHR" }), CFG).computedPrice,
    ).toBe(180);
  });

  it("is 0 when the airport has no price for the chosen lounge and the city has no base", () => {
    expect(
      computeStepPrice(step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY", city: "DXB", airport: "DXBT", loungeType: "EXECUTIVE_OFFICE" }), CFG).computedPrice,
    ).toBe(0);
  });
});

describe("computeStepPrice — skipped", () => {
  it("returns 0 for a skipped or SKIP step", () => {
    expect(computeStepPrice(step({ skipped: true }), CFG).computedPrice).toBe(0);
    expect(computeStepPrice(step({ serviceType: "SKIP" }), CFG).computedPrice).toBe(0);
  });
});

describe("computeJourneyPricing — accumulative sum", () => {
  it("sums the selected step prices", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "HOME_TO_RIYADH_AIRPORT", serviceType: "CAR_ONLY", carCategory: "VIP" }), // 350
      step({ stepType: "DEPARTURE_ASSIST_RIYADH", serviceType: "MEET_ASSIST_ONLY", loungeType: "EXECUTIVE_OFFICE" }), // 320
      step({ stepType: "AIRPORT_TO_HOTEL", serviceType: "CAR_ONLY", carCategory: "VVIP" }), // 760
    ];
    expect(computeJourneyPricing(steps, CFG).estimatedTotal).toBe(350 + 320 + 760);
  });

  it("excludes skipped steps from the total", () => {
    const steps: JourneyStepInput[] = [
      step({ stepType: "HOME_TO_RIYADH_AIRPORT", serviceType: "CAR_ONLY", carCategory: "VIP" }),
      step({ stepType: "AIRPORT_TO_HOTEL", skipped: true }),
    ];
    expect(computeJourneyPricing(steps, CFG).estimatedTotal).toBe(350);
  });
});

describe("formatPrice", () => {
  it("formats a SAR amount", () => {
    expect(formatPrice(1000, "en")).toContain("1,000");
    expect(formatPrice(1000, "ar")).toContain("﷼");
  });
});
