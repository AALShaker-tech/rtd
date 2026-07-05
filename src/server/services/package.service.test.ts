import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: { servicePackage: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getPackageCatalog } from "@/server/services/package.service";
import { FALLBACK_PACKAGES } from "@/lib/packages";

const findMany = (prisma as any).servicePackage.findMany as ReturnType<typeof vi.fn>;

beforeEach(() => findMany.mockReset());

describe("getPackageCatalog", () => {
  it("maps active DB packages (includedSteps → steps)", async () => {
    findMany.mockResolvedValue([
      {
        type: "ARRIVAL",
        nameEn: "Arrival",
        nameAr: "الوصول",
        descriptionEn: "d",
        descriptionAr: "و",
        includedSteps: ["ARRIVAL_ASSIST_DESTINATION", "AIRPORT_TO_HOTEL"],
        featured: true,
        sortOrder: 1,
      },
    ]);
    const cat = await getPackageCatalog();
    expect(cat).toHaveLength(1);
    expect(cat[0]).toMatchObject({ type: "ARRIVAL", featured: true, steps: ["ARRIVAL_ASSIST_DESTINATION", "AIRPORT_TO_HOTEL"] });
  });

  it("falls back to the built-in packages when the DB is empty", async () => {
    findMany.mockResolvedValue([]);
    expect(await getPackageCatalog()).toEqual(FALLBACK_PACKAGES);
  });
});
