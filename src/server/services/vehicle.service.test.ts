import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: { vehicleCategory: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getVehicleCatalog } from "@/server/services/vehicle.service";
import { FALLBACK_VEHICLES } from "@/lib/vehicles";

const findMany = (prisma as any).vehicleCategory.findMany as ReturnType<typeof vi.fn>;

beforeEach(() => findMany.mockReset());

describe("getVehicleCatalog", () => {
  it("maps active DB rows to the customer-facing catalog shape", async () => {
    findMany.mockResolvedValue([
      {
        category: "VIP",
        nameEn: "Business",
        nameAr: "أعمال",
        maxPassengers: 8,
        exampleModels: "V-Class",
        descriptionEn: "d",
        descriptionAr: "و",
        isRecommended: true,
        priceMultiplier: 1.6,
        sortOrder: 1,
      },
    ]);

    const cat = await getVehicleCatalog();
    expect(cat).toHaveLength(1);
    expect(cat[0]).toMatchObject({
      category: "VIP",
      nameEn: "Business",
      maxPassengers: 8,
      isRecommended: true,
      multiplier: 1.6, // priceMultiplier → multiplier
    });
  });

  it("falls back to the built-in fleet when the DB has no vehicles", async () => {
    findMany.mockResolvedValue([]);
    const cat = await getVehicleCatalog();
    expect(cat).toEqual(FALLBACK_VEHICLES);
  });
});
