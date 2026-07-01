import { describe, it, expect } from "vitest";
import { isVerifiedWithinWindow, DEFAULT_VERIFIED_WINDOW_MS } from "@/lib/verification-policy";

const NOW = new Date("2026-07-01T12:00:00Z");
const HOUR = 60 * 60 * 1000;

describe("isVerifiedWithinWindow", () => {
  it("is false when there are no records (nothing was ever verified)", () => {
    expect(isVerifiedWithinWindow([], NOW)).toBe(false);
  });

  it("is true for a code consumed within the window", () => {
    const records = [{ consumed: true, createdAt: new Date(NOW.getTime() - HOUR) }];
    expect(isVerifiedWithinWindow(records, NOW)).toBe(true);
  });

  it("is false for an unconsumed (never-verified / superseded) code", () => {
    const records = [{ consumed: false, createdAt: new Date(NOW.getTime() - HOUR) }];
    expect(isVerifiedWithinWindow(records, NOW)).toBe(false);
  });

  it("is false for a verification older than the window", () => {
    const stale = new Date(NOW.getTime() - DEFAULT_VERIFIED_WINDOW_MS - HOUR);
    expect(isVerifiedWithinWindow([{ consumed: true, createdAt: stale }], NOW)).toBe(false);
  });

  it("accepts a fresh verification even when a stale/unconsumed one is present", () => {
    const records = [
      { consumed: false, createdAt: new Date(NOW.getTime() - HOUR) },
      { consumed: true, createdAt: new Date(NOW.getTime() - 2 * HOUR) },
    ];
    expect(isVerifiedWithinWindow(records, NOW)).toBe(true);
  });

  it("honours a custom window", () => {
    const records = [{ consumed: true, createdAt: new Date(NOW.getTime() - 2 * HOUR) }];
    expect(isVerifiedWithinWindow(records, NOW, HOUR)).toBe(false); // 2h old, 1h window
    expect(isVerifiedWithinWindow(records, NOW, 3 * HOUR)).toBe(true);
  });
});
