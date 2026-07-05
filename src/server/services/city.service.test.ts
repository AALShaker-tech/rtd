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

describe("getCityCatalog — lounge (enable/disable) reflection", () => {
  // LON is an international city → default lounges are MEET_ASSIST & FAST_TRACK.
  it("offers the country default lounges when nothing is configured", async () => {
    cityFindMany.mockResolvedValue([city({ code: "LON", loungePricing: [] })]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].lounges).toEqual(
      expect.arrayContaining(["MEET_ASSIST", "FAST_TRACK"]),
    );
  });

  it("removes a disabled default lounge (disable actually sticks)", async () => {
    cityFindMany.mockResolvedValue([
      city({ code: "LON", loungePricing: [{ loungeType: "MEET_ASSIST", enabled: false }] }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].lounges).not.toContain("MEET_ASSIST");
    expect(catalog.cities[0].lounges).toContain("FAST_TRACK");
  });

  it("does not resurrect a disabled lounge that was explicitly added then turned off", async () => {
    // The reported case: Marhaba offered for a destination, then disabled.
    cityFindMany.mockResolvedValue([
      city({ code: "IST", country: "TR", loungePricing: [{ loungeType: "MARHABA", enabled: false }] }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].lounges).not.toContain("MARHABA");
  });

  it("adds an explicitly enabled non-default lounge on top of the defaults", async () => {
    cityFindMany.mockResolvedValue([
      city({ code: "LON", loungePricing: [{ loungeType: "MARHABA", enabled: true }] }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].lounges).toEqual(
      expect.arrayContaining(["MARHABA", "MEET_ASSIST", "FAST_TRACK"]),
    );
  });

  it("can disable every lounge for a city (empty list, no fallback to defaults)", async () => {
    cityFindMany.mockResolvedValue([
      city({
        code: "LON",
        loungePricing: [
          { loungeType: "MEET_ASSIST", enabled: false },
          { loungeType: "FAST_TRACK", enabled: false },
        ],
      }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].lounges).toEqual([]);
  });
});
