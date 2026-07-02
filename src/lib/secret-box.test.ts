import { describe, it, expect, vi, beforeAll } from "vitest";

// secret-box is a server-only module; neutralize the guard for the test.
vi.mock("server-only", () => ({}));

import { encryptSecret, decryptSecret } from "@/lib/secret-box";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-auth-secret-abcdefghijklmnopqrstuvwxyz";
});

describe("secret-box (AES-256-GCM)", () => {
  it("round-trips a value in the v1 format", () => {
    const enc = encryptSecret("hunter2");
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc.split(":")).toHaveLength(4);
    expect(decryptSecret(enc)).toBe("hunter2");
  });

  it("round-trips unicode and values containing colons/whitespace", () => {
    // Colons in the plaintext must not confuse the `:`-delimited envelope.
    expect(decryptSecret(encryptSecret("مفتاح-سري 🔐"))).toBe("مفتاح-سري 🔐");
    expect(decryptSecret(encryptSecret("key: a b:c"))).toBe("key: a b:c");
  });

  it("uses a fresh IV so identical plaintext encrypts differently", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects an unrecognized format", () => {
    expect(() => decryptSecret("nope")).toThrow();
    expect(() => decryptSecret("v2:a:b:c")).toThrow();
  });

  it("fails to decrypt tampered ciphertext (auth tag catches it)", () => {
    const [v, iv, tag, ct] = encryptSecret("secret").split(":");
    const bytes = Buffer.from(ct, "base64");
    bytes[0] ^= 0xff; // flip a byte in the ciphertext
    const tampered = [v, iv, tag, bytes.toString("base64")].join(":");
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
