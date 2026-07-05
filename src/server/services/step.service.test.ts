import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: { serviceStep: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getStepCatalog, getStepMap } from "@/server/services/step.service";
import { FALLBACK_STEPS } from "@/lib/steps";

const findMany = (prisma as any).serviceStep.findMany as ReturnType<typeof vi.fn>;

beforeEach(() => findMany.mockReset());

const ROW = {
  code: "MEET_GREET",
  nameEn: "Meet & greet",
  nameAr: "استقبال",
  shortNameEn: "Meet",
  shortNameAr: "استقبال",
  descriptionEn: "d",
  descriptionAr: "و",
  sortOrder: 3,
  cityScope: "DESTINATION",
  featTransfer: false,
  featAssistance: true,
  featFlight: true,
  featHotel: false,
  featHome: false,
  featChauffeur: false,
  createsDriverTask: false,
  active: true,
};

describe("getStepCatalog", () => {
  it("maps active DB rows to catalog shape with a nested feature set", async () => {
    findMany.mockResolvedValue([ROW]);
    const cat = await getStepCatalog();
    expect(cat).toHaveLength(1);
    expect(cat[0]).toMatchObject({
      code: "MEET_GREET",
      nameEn: "Meet & greet",
      sortOrder: 3,
      cityScope: "DESTINATION",
      features: { assistance: true, flight: true, transfer: false, chauffeur: false },
    });
  });

  it("falls back to the built-in steps when the DB has none active", async () => {
    findMany.mockResolvedValue([]);
    const cat = await getStepCatalog();
    expect(cat).toEqual(FALLBACK_STEPS);
  });
});

describe("getStepMap", () => {
  it("keys steps by code and includes inactive ones", async () => {
    findMany.mockResolvedValue([{ ...ROW, active: false }]);
    const map = await getStepMap();
    expect(map.MEET_GREET.active).toBe(false);
    expect(map.MEET_GREET.features.assistance).toBe(true);
  });

  it("falls back to built-ins when the table is empty", async () => {
    findMany.mockResolvedValue([]);
    const map = await getStepMap();
    // Every fallback code is present.
    for (const s of FALLBACK_STEPS) expect(map[s.code]).toBeTruthy();
  });
});
