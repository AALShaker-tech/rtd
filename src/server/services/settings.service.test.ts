import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: { setting: { findMany: vi.fn() }, user: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { resolveSettings, getOpsTargets } from "@/server/services/settings.service";
import { encryptSecret } from "@/lib/secret-box";

const findMany = (prisma as any).setting.findMany as ReturnType<typeof vi.fn>;
const userFindMany = (prisma as any).user.findMany as ReturnType<typeof vi.fn>;

beforeAll(() => {
  process.env.AUTH_SECRET = "test-auth-secret-abcdefghijklmnopqrstuvwxyz";
});
beforeEach(() => {
  findMany.mockReset();
  userFindMany.mockReset();
});

describe("resolveSettings", () => {
  it("falls back to the env var when there is no DB row", async () => {
    findMany.mockResolvedValue([]);
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "111222";
    const s = await resolveSettings();
    expect(s["whatsapp.number"]).toBe("111222");
  });

  it("prefers a stored DB value over the env fallback (non-secret)", async () => {
    findMany.mockResolvedValue([{ key: "whatsapp.number", value: "999" }]);
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "111222";
    const s = await resolveSettings();
    expect(s["whatsapp.number"]).toBe("999");
  });

  it("decrypts a stored secret before returning it", async () => {
    findMany.mockResolvedValue([{ key: "smtp.password", value: encryptSecret("s3cr3t") }]);
    const s = await resolveSettings();
    expect(s["smtp.password"]).toBe("s3cr3t");
  });

  it("returns an empty string for an undecryptable secret (never throws)", async () => {
    findMany.mockResolvedValue([{ key: "smtp.password", value: "not-actually-encrypted" }]);
    const s = await resolveSettings();
    expect(s["smtp.password"]).toBe("");
  });
});

describe("getOpsTargets", () => {
  beforeEach(() => {
    delete process.env.OPS_ALERT_EMAIL;
    delete process.env.OPS_ALERT_PHONE;
  });

  it("returns every active admin email", async () => {
    findMany.mockResolvedValue([]);
    userFindMany.mockResolvedValue([{ email: "a@ratbli.sa" }, { email: "b@ratbli.sa" }]);
    const { emails } = await getOpsTargets();
    expect(emails).toEqual(["a@ratbli.sa", "b@ratbli.sa"]);
  });

  it("adds the configured ops email as an extra recipient", async () => {
    findMany.mockResolvedValue([{ key: "ops.alertEmail", value: "ops@ratbli.sa" }]);
    userFindMany.mockResolvedValue([{ email: "a@ratbli.sa" }]);
    const { emails } = await getOpsTargets();
    expect(emails).toEqual(["ops@ratbli.sa", "a@ratbli.sa"]);
  });

  it("dedupes the configured email against an admin (case-insensitive)", async () => {
    findMany.mockResolvedValue([{ key: "ops.alertEmail", value: "Admin@Ratbli.sa" }]);
    userFindMany.mockResolvedValue([{ email: "admin@ratbli.sa" }]);
    const { emails } = await getOpsTargets();
    expect(emails).toEqual(["Admin@Ratbli.sa"]);
  });

  it("only queries active ADMINs (superadmins excluded)", async () => {
    findMany.mockResolvedValue([]);
    userFindMany.mockResolvedValue([]);
    await getOpsTargets();
    expect(userFindMany).toHaveBeenCalledWith({
      where: { isActive: true, role: "ADMIN" },
      select: { email: true },
    });
  });
});
