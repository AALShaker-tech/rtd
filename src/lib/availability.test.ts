import { describe, it, expect } from "vitest";
import { isStepOffered, pricedVehicleClasses } from "@/lib/availability";
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from "@/lib/pricing";
import { getStep } from "@/lib/domain";

const carDef = getStep("HOME_TO_RIYADH_AIRPORT")!; // transfer
const assistDef = getStep("DEPARTURE_ASSIST_RIYADH")!; // assistance
const chauffeurDef = getStep("CHAUFFEUR_DURING_STAY")!; // chauffeur

function cfg(over: Partial<PricingConfig>): PricingConfig {
  return { ...DEFAULT_PRICING_CONFIG, ...over };
}

describe("pricedVehicleClasses", () => {
  it("returns only classes with a price > 0", () => {
    const config = cfg({ cityServiceClassPrices: { RUH: { HOME_TO_RIYADH_AIRPORT: { ECONOMY: 0, VIP: 350, VVIP: 500 } } } });
    expect(pricedVehicleClasses(config, "RUH", "HOME_TO_RIYADH_AIRPORT").sort()).toEqual(["VIP", "VVIP"]);
  });
  it("is empty when the city has no class prices", () => {
    expect(pricedVehicleClasses(cfg({}), "LON", "HOME_TO_RIYADH_AIRPORT")).toEqual([]);
  });
});

describe("isStepOffered", () => {
  it("car step: offered only when at least one class is priced", () => {
    expect(isStepOffered(carDef, "RUH", cfg({ cityServiceClassPrices: { RUH: { HOME_TO_RIYADH_AIRPORT: { VIP: 350 } } } }), [])).toBe(true);
    expect(isStepOffered(carDef, "RUH", cfg({ cityServiceClassPrices: { RUH: { HOME_TO_RIYADH_AIRPORT: { VIP: 0 } } } }), [])).toBe(false);
    expect(isStepOffered(carDef, "RUH", cfg({}), [])).toBe(false);
  });
  it("chauffeur step: offered only when a class is priced", () => {
    expect(isStepOffered(chauffeurDef, "LON", cfg({ cityServiceClassPrices: { LON: { CHAUFFEUR_DURING_STAY: { VIP: 900 } } } }), [])).toBe(true);
    expect(isStepOffered(chauffeurDef, "LON", cfg({}), [])).toBe(false);
  });
  it("assistance step: offered only when a priced lounge is available", () => {
    expect(isStepOffered(assistDef, "RUH", cfg({}), [250, 0])).toBe(true);
    expect(isStepOffered(assistDef, "RUH", cfg({}), [0, 0])).toBe(false);
    expect(isStepOffered(assistDef, "RUH", cfg({}), [])).toBe(false);
  });
});
