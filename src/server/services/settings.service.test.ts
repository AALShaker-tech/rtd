import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { setting: { findMany: vi.fn() } } }));

import { prisma } from "@/lib/prisma";
import { resolveSettings } from "@/server/services/settings.service";
import { encryptSecret } from "@/lib/secret-box";

const findMany = (prisma as any).setting.findMany as ReturnType<typeof vi.fn>;

beforeAll(() => {
  process.env.AUTH_SECRET = "test-auth-secret-abcdefghijklmnopqrstuvwxyz";
});
beforeEach(() => findMany.mockReset());

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
