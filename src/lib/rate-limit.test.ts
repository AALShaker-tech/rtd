import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimit());

  it("allows hits up to the limit, then blocks", () => {
    const t0 = 1_000_000;
    expect(rateLimit("k", 3, 60_000, t0).allowed).toBe(true);
    expect(rateLimit("k", 3, 60_000, t0).allowed).toBe(true);
    expect(rateLimit("k", 3, 60_000, t0).allowed).toBe(true);
    const blocked = rateLimit("k", 3, 60_000, t0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports the remaining allowance", () => {
    const t0 = 1_000_000;
    expect(rateLimit("k", 5, 60_000, t0).remaining).toBe(4);
    expect(rateLimit("k", 5, 60_000, t0).remaining).toBe(3);
  });

  it("resets after the window elapses", () => {
    const t0 = 1_000_000;
    rateLimit("k", 1, 60_000, t0);
    expect(rateLimit("k", 1, 60_000, t0).allowed).toBe(false);
    // A hit after the window rolls over is allowed again.
    expect(rateLimit("k", 1, 60_000, t0 + 60_001).allowed).toBe(true);
  });

  it("tracks distinct keys independently", () => {
    const t0 = 1_000_000;
    expect(rateLimit("a", 1, 60_000, t0).allowed).toBe(true);
    expect(rateLimit("a", 1, 60_000, t0).allowed).toBe(false);
    expect(rateLimit("b", 1, 60_000, t0).allowed).toBe(true);
  });
});
