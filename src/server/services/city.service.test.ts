import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    city: { findMany: vi.fn() },
    servicePricing: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getCityCatalog } from "@/server/services/city.service";

const cityFindMany = (prisma as any).city.findMany as ReturnType<typeof vi.fn>;
const serviceFindMany = (prisma as any).servicePricing.findMany as ReturnType<typeof vi.fn>;

function city(overrides: Partial<any> = {}) {
  return {
    code: "LON",
    nameEn: "London",
    nameAr: "لندن",
    country: "GB",
    isOrigin: false,
    multiplier: 1.2,
    airports: [],
    loungePricing: [],
    servicePricing: [],
    ...overrides,
  };
}

beforeEach(() => {
  cityFindMany.mockReset();
  serviceFindMany.mockReset();
});

describe("getCityCatalog — feature (enable/disable) reflection", () => {
  it("marks a per-city disabled service as a disabled step for that city", async () => {
    cityFindMany.mockResolvedValue([
      city({ servicePricing: [{ stepType: "AIRPORT_TO_HOTEL", enabled: false }] }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].disabledSteps).toContain("AIRPORT_TO_HOTEL");
  });

  it("folds a globally-disabled service into every city's disabled steps", async () => {
    cityFindMany.mockResolvedValue([city({ code: "LON" }), city({ code: "PAR" })]);
    // Globally turned off on the Pricing page (active = false).
    serviceFindMany.mockResolvedValue([{ stepType: "DEPARTURE_ASSIST_RIYADH" }]);

    const catalog = await getCityCatalog();
    for (const c of catalog.cities) {
      expect(c.disabledSteps).toContain("DEPARTURE_ASSIST_RIYADH");
    }
  });

  it("does not duplicate a step disabled both globally and per-city", async () => {
    cityFindMany.mockResolvedValue([
      city({ servicePricing: [{ stepType: "DEPARTURE_ASSIST_RIYADH", enabled: false }] }),
    ]);
    serviceFindMany.mockResolvedValue([{ stepType: "DEPARTURE_ASSIST_RIYADH" }]);

    const catalog = await getCityCatalog();
    const occurrences = catalog.cities[0].disabledSteps.filter((s) => s === "DEPARTURE_ASSIST_RIYADH");
    expect(occurrences).toHaveLength(1);
  });

  it("leaves disabledSteps empty when nothing is turned off", async () => {
    cityFindMany.mockResolvedValue([city()]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].disabledSteps).toEqual([]);
  });
});
