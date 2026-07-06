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
    vehiclePricing: [],
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

describe("getCityCatalog — vehicle (per-city) availability", () => {
  it("marks a per-city disabled vehicle category as disabled for that city", async () => {
    cityFindMany.mockResolvedValue([
      city({ vehiclePricing: [{ category: "VVIP", enabled: false }, { category: "VIP", enabled: true }] }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].disabledVehicles).toContain("VVIP");
    expect(catalog.cities[0].disabledVehicles).not.toContain("VIP");
  });

  it("leaves disabledVehicles empty when nothing is turned off", async () => {
    cityFindMany.mockResolvedValue([city()]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].disabledVehicles).toEqual([]);
  });
});

describe("getCityCatalog — airport lounges", () => {
  it("exposes an airport's enabled lounges with name + per-airport price", async () => {
    cityFindMany.mockResolvedValue([
      city({
        code: "LON",
        airports: [
          {
            code: "LHR", nameEn: "Heathrow", nameAr: "هيثرو", terminals: [],
            lounges: [
              { loungeId: "MEET_ASSIST", price: 180, lounge: { active: true, nameEn: "Meet & Assist", nameAr: "الاستقبال", descriptionEn: "desc", descriptionAr: "وصف" } },
            ],
          },
        ],
      }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    const lounges = catalog.cities[0].airports[0].lounges;
    expect(lounges).toHaveLength(1);
    expect(lounges[0]).toMatchObject({ id: "MEET_ASSIST", price: 180, nameEn: "Meet & Assist" });
  });

  it("keeps each airport's lounges separate (multi-airport city)", async () => {
    cityFindMany.mockResolvedValue([
      city({
        code: "LON",
        airports: [
          { code: "LHR", nameEn: "Heathrow", nameAr: "هيثرو", terminals: [], lounges: [
            { loungeId: "FAST_TRACK", price: 200, lounge: { active: true, nameEn: "Fast Track", nameAr: "سريع", descriptionEn: "", descriptionAr: "" } },
          ] },
          { code: "LGW", nameEn: "Gatwick", nameAr: "غاتويك", terminals: [], lounges: [] },
        ],
      }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].airports[0].lounges.map((l) => l.id)).toEqual(["FAST_TRACK"]);
    expect(catalog.cities[0].airports[1].lounges).toEqual([]);
  });

  it("hides a lounge whose catalog entry has been deactivated", async () => {
    cityFindMany.mockResolvedValue([
      city({
        code: "LON",
        airports: [
          { code: "LHR", nameEn: "Heathrow", nameAr: "هيثرو", terminals: [], lounges: [
            { loungeId: "OLD", price: 100, lounge: { active: false, nameEn: "Old", nameAr: "قديم", descriptionEn: "", descriptionAr: "" } },
          ] },
        ],
      }),
    ]);
    serviceFindMany.mockResolvedValue([]);

    const catalog = await getCityCatalog();
    expect(catalog.cities[0].airports[0].lounges).toEqual([]);
  });
});
