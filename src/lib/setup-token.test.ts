import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateSetupToken, hashSetupToken } from "@/lib/setup-token";

describe("setup tokens", () => {
  it("hashes deterministically to 64 hex chars (SHA-256)", () => {
    const h = hashSetupToken("some-raw-token");
    expect(h).toBe(hashSetupToken("some-raw-token"));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates a URL-safe raw token whose stored hash matches", () => {
    const { raw, hash } = generateSetupToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/); // base64url — no +, /, or =
    expect(raw.length).toBeGreaterThanOrEqual(40); // 32 random bytes
    expect(hash).toBe(hashSetupToken(raw));
  });

  it("generates a distinct token each call", () => {
    expect(generateSetupToken().raw).not.toBe(generateSetupToken().raw);
  });
});
